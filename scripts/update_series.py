"""
시리즈 수동 업데이트 스크립트
컬렉션 이름과 제목에 포함되는 단어로 필터링하여 시리즈를 일괄 설정
"""
import asyncio
import os
import click
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient

# .env 파일에서 필요한 환경변수만 로드
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# 필요한 환경변수 가져오기
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'mystorage')

MONGO_HOST = os.getenv('MONGO_HOST', 'localhost')
MONGO_PORT = os.getenv('MONGO_PORT', '27017')
MONGO_USER = os.getenv('MONGO_USER', 'admin')
MONGO_PASSWORD = os.getenv('MONGO_PASSWORD', 'admin')
MONGO_DB = os.getenv('MONGO_DB', 'mystorage')

# DB 연결 URL
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
MONGO_URL = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}"

# SQLAlchemy 설정
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# MongoDB 클라이언트 (전역)
mongo_client = None
mongo_db = None

# Collection 모델 (간단한 정의만)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, JSON

class Base(DeclarativeBase):
    pass

class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    slug = Column(String, unique=True)
    mongo_collection = Column(String)


async def update_series_by_title(
    collection_name: str,
    title_keyword: str,
    series_name: str,
    dry_run: bool = True,
    only_empty: bool = False
):
    """
    제목에 특정 키워드가 포함된 아이템의 시리즈를 업데이트

    Args:
        collection_name: 컬렉션 이름 (slug)
        title_keyword: 제목에 포함되어야 하는 키워드
        series_name: 설정할 시리즈명
        dry_run: True면 실제 업데이트 없이 미리보기만, False면 실제 업데이트
        only_empty: True면 시리즈가 없는 아이템만 대상
    """
    global mongo_client, mongo_db

    # MongoDB 연결
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    mongo_db = mongo_client[MONGO_DB]

    # PostgreSQL 세션
    db = SessionLocal()

    try:
        # PostgreSQL에서 컬렉션 조회
        stmt = select(Collection).where(Collection.slug == collection_name)
        result = db.execute(stmt)
        collection = result.scalar_one_or_none()

        if not collection:
            click.echo(click.style(f"❌ 컬렉션 '{collection_name}'을 찾을 수 없습니다.", fg='red'))
            return

        if not collection.mongo_collection:
            click.echo(click.style(f"❌ MongoDB 컬렉션이 설정되지 않았습니다.", fg='red'))
            return

        click.echo(click.style(f"\n📚 컬렉션: {collection.name} (ID: {collection.id})", fg='blue', bold=True))
        click.echo(click.style(f"🔍 키워드: '{title_keyword}'", fg='cyan'))
        click.echo(click.style(f"📖 시리즈명: '{series_name}'", fg='cyan'))
        if only_empty:
            click.echo(click.style(f"⚠️  필터: 시리즈가 없는 아이템만 대상", fg='yellow'))
        click.echo("=" * 80 + "\n")

        # MongoDB에서 아이템 조회
        mongo_collection = mongo_db[collection.mongo_collection]

        # 모든 아이템 조회 (제한 없이)
        items = await mongo_collection.find().to_list(None)

        # 필터링 및 업데이트 대상 목록
        matched_items = []

        for item in items:
            title = item.get('metadata', {}).get('title', '')
            current_series = item.get('metadata', {}).get('series', '')

            # 제목에 키워드가 포함되어 있는지 확인 (대소문자 구분 없음)
            if title_keyword.lower() in title.lower():
                # only_empty 옵션이 켜져있으면 시리즈가 없는 것만 필터링
                if only_empty and current_series:
                    continue

                matched_items.append({
                    'id': item['_id'],
                    'title': title,
                    'current_series': current_series,
                    'item': item
                })

        if not matched_items:
            click.echo(click.style(f"⚠️  키워드 '{title_keyword}'와 일치하는 아이템이 없습니다.", fg='yellow'))
            return

        click.echo(click.style(f"✅ {len(matched_items)}개의 아이템을 찾았습니다:\n", fg='green', bold=True))

        # 매칭된 아이템 출력
        for idx, item_info in enumerate(matched_items, 1):
            current = item_info['current_series']
            current_display = f"'{current}'" if current else "(없음)"
            click.echo(f"{idx}. {item_info['title']}")
            click.echo(click.style(f"   현재 시리즈: {current_display} → 변경될 시리즈: '{series_name}'", fg='bright_black'))
            click.echo()

        if dry_run:
            click.echo("=" * 80)
            click.echo(click.style("🔍 DRY RUN 모드: 실제로 업데이트되지 않았습니다.", fg='yellow', bold=True))
            click.echo(click.style("실제로 업데이트하려면 --execute 플래그를 사용하세요.", fg='yellow'))
            return

        # 실제 업데이트 실행
        click.echo("=" * 80)
        click.echo(click.style("⚙️  업데이트를 시작합니다...\n", fg='blue', bold=True))

        updated_count = 0
        for item_info in matched_items:
            try:
                # 메타데이터 업데이트
                new_metadata = item_info['item'].get('metadata', {}).copy()
                new_metadata['series'] = series_name

                # MongoDB에서 직접 업데이트
                await mongo_collection.update_one(
                    {"_id": item_info['id']},
                    {
                        "$set": {
                            "metadata": new_metadata,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )

                updated_count += 1
                click.echo(click.style(f"✅ 업데이트 완료: {item_info['title']}", fg='green'))

            except Exception as e:
                click.echo(click.style(f"❌ 업데이트 실패: {item_info['title']}", fg='red'))
                click.echo(click.style(f"   오류: {str(e)}", fg='red'))

        click.echo(f"\n{'='*80}")
        click.echo(click.style(f"🎉 완료! {updated_count}/{len(matched_items)}개 아이템이 업데이트되었습니다.", fg='green', bold=True))

    except Exception as e:
        click.echo(click.style(f"❌ 오류 발생: {str(e)}", fg='red', bold=True))
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        if mongo_client:
            mongo_client.close()


@click.command()
@click.option('--collection', '-c', required=True, help='컬렉션 이름 (slug)')
@click.option('--keyword', '-k', required=True, help='제목에 포함되어야 할 키워드')
@click.option('--series', '-s', required=True, help='설정할 시리즈명')
@click.option('--execute', is_flag=True, help='실제로 업데이트 실행 (없으면 미리보기만)')
@click.option('--only-empty', is_flag=True, help='시리즈가 없는 아이템만 대상')
def main(collection: str, keyword: str, series: str, execute: bool, only_empty: bool):
    """
    시리즈 수동 업데이트 스크립트

    제목에 키워드가 포함된 아이템의 시리즈를 일괄 업데이트합니다.

    예시:

        # 미리보기 (DRY RUN)
        python scripts/update_series.py -c books -k "원피스" -s "원피스"

        # 실제 업데이트
        python scripts/update_series.py -c books -k "원피스" -s "원피스" --execute

        # 시리즈가 없는 아이템만 업데이트
        python scripts/update_series.py -c books -k "원피스" -s "원피스" --only-empty --execute
    """
    click.echo("""
╔════════════════════════════════════════════════════════════════╗
║                   시리즈 수동 업데이트 스크립트                  ║
╚════════════════════════════════════════════════════════════════╝
    """)

    asyncio.run(update_series_by_title(
        collection_name=collection,
        title_keyword=keyword,
        series_name=series,
        dry_run=not execute,
        only_empty=only_empty
    ))


if __name__ == "__main__":
    main()
