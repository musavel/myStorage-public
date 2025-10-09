"""
스크래퍼 테스트 스크립트
교보문고와 알라딘에서 실제로 추출 가능한 정보를 확인
"""
import asyncio
import sys
import os

# 프로젝트 루트를 Python path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.services.scraper.web_scraper import WebScraper


async def main():
    urls = [
        ("교보문고-만화", "https://product.kyobobook.co.kr/detail/S000001713046"),
        ("교보문고-일반도서", "https://product.kyobobook.co.kr/detail/S000218055272"),
        ("알라딘", "https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=281358410"),
        ("알라딘-일반도서", "https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=373240731")
    ]

    async with WebScraper() as scraper:
        for site_name, url in urls:
            print(f"\n{'='*80}")
            print(f"🔍 {site_name}: {url}")
            print('='*80)

            try:
                result = await scraper.scrape_url(url)

                print("\n📋 추출된 정보:")
                for key, value in sorted(result.items()):
                    if key == 'description' and value and len(str(value)) > 200:
                        print(f"  {key}: {str(value)[:200]}...")
                    else:
                        print(f"  {key}: {value}")

                # 페이지수와 카테고리 확인
                if 'pages' in result:
                    print(f"\n✅ 페이지수: {result['pages']}")
                else:
                    print(f"\n❌ 페이지수 없음")

                if 'category' in result:
                    print(f"✅ 카테고리: {result['category']}")
                else:
                    print(f"❌ 카테고리 없음")

            except Exception as e:
                print(f"❌ 오류 발생: {e}")
                import traceback
                traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
