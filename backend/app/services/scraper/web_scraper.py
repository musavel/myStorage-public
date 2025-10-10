"""
웹 페이지 스크래핑 서비스
Playwright를 사용하여 JavaScript 렌더링된 페이지도 크롤링
"""
import asyncio
import logging
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)


class WebScraper:
    """웹 페이지 메타데이터 추출"""

    def __init__(self):
        self._browser: Optional[Browser] = None

    async def __aenter__(self):
        """Context manager 진입"""
        self.playwright = await async_playwright().start()
        self._browser = await self.playwright.chromium.launch(headless=True)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager 종료"""
        if self._browser:
            await self._browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """
        URL에서 메타데이터 추출

        Args:
            url: 크롤링할 URL

        Returns:
            추출된 메타데이터 딕셔너리

        Raises:
            ValueError: 필수 필드가 없거나 페이지 로딩 실패 시
        """
        if not self._browser:
            raise RuntimeError("WebScraper must be used as context manager")

        page = await self._browser.new_page()

        try:
            # 페이지 로드 (최대 60초 대기, domcontentloaded로 변경하여 속도 개선)
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)

            # 페이지 소스 가져오기
            content = await page.content()

            # BeautifulSoup으로 파싱
            soup = BeautifulSoup(content, 'html.parser')

            # 메타데이터 추출
            metadata = await self._extract_metadata(soup, page)
            metadata['source_url'] = url

            # 필수 필드 검증
            if not metadata.get('title') or not metadata['title'].strip():
                raise ValueError(f"페이지에서 제목을 찾을 수 없습니다. 페이지 로딩이 실패했거나 차단되었을 수 있습니다.")

            return metadata

        finally:
            await page.close()

    async def _extract_metadata(self, soup: BeautifulSoup, page: Page) -> Dict[str, Any]:
        """HTML에서 메타데이터 추출"""
        metadata = {}

        # Open Graph 메타 태그
        og_tags = {
            'og:title': 'title',
            'og:description': 'description',
            'og:image': 'image',
            'og:type': 'type',
        }

        for og_key, meta_key in og_tags.items():
            tag = soup.find('meta', property=og_key)
            if tag and tag.get('content'):
                metadata[meta_key] = tag['content']

        # Twitter Card 메타 태그
        twitter_tags = {
            'twitter:title': 'title',
            'twitter:description': 'description',
            'twitter:image': 'image',
        }

        for twitter_key, meta_key in twitter_tags.items():
            if meta_key not in metadata:
                tag = soup.find('meta', attrs={'name': twitter_key})
                if tag and tag.get('content'):
                    metadata[meta_key] = tag['content']

        # 일반 메타 태그
        if 'description' not in metadata:
            desc_tag = soup.find('meta', attrs={'name': 'description'})
            if desc_tag and desc_tag.get('content'):
                metadata['description'] = desc_tag['content']

        # 페이지 제목 (fallback)
        if 'title' not in metadata:
            title_tag = soup.find('title')
            if title_tag:
                metadata['title'] = title_tag.get_text().strip()

        # JSON-LD 구조화된 데이터
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                import json
                data = json.loads(script.string)

                if isinstance(data, dict):
                    # Book schema
                    if data.get('@type') == 'Book':
                        metadata['title'] = data.get('name', metadata.get('title'))

                        # author 처리 (dict 또는 string 가능)
                        author_data = data.get('author')
                        if isinstance(author_data, dict):
                            metadata['author'] = author_data.get('name')
                        elif isinstance(author_data, str):
                            metadata['author'] = author_data

                        # publisher 처리 (dict 또는 string 가능)
                        publisher_data = data.get('publisher')
                        if isinstance(publisher_data, dict):
                            metadata['publisher'] = publisher_data.get('name')
                        elif isinstance(publisher_data, str):
                            metadata['publisher'] = publisher_data

                        metadata['isbn'] = data.get('isbn')
                        metadata['date_published'] = data.get('datePublished')

                        # 가격 정보
                        if 'offers' in data:
                            offers = data['offers']
                            if isinstance(offers, dict):
                                metadata['price'] = offers.get('price')

                    # Product schema
                    elif data.get('@type') == 'Product':
                        metadata['title'] = data.get('name', metadata.get('title'))
                        metadata['description'] = data.get('description', metadata.get('description'))

                        if 'offers' in data:
                            offers = data['offers']
                            if isinstance(offers, dict):
                                metadata['price'] = offers.get('price')

            except Exception:
                continue

        # 사이트별 특화 파싱
        url = page.url  # 속성이므로 await 불필요
        if 'kyobobook.co.kr' in url:
            metadata.update(await self._parse_kyobo(soup, page, metadata))
        elif 'aladin.co.kr' in url:
            metadata.update(await self._parse_aladin(soup, page))

        return metadata

    async def _parse_kyobo(self, soup: BeautifulSoup, page: Page, existing_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """교보문고 페이지 특화 파싱"""
        metadata = {}

        try:
            # 책 제목
            title_elem = await page.query_selector('.prod_title')
            if title_elem:
                metadata['title'] = (await title_elem.text_content()).strip()

            # 저자 정보
            author_elem = await page.query_selector('.author a')
            if author_elem:
                metadata['author'] = (await author_elem.text_content()).strip()

            # 출판사와 출판일 (.prod_info_text.publish_date에서 함께 추출)
            publish_info_elem = await page.query_selector('.prod_info_text.publish_date')
            if publish_info_elem:
                publish_text = (await publish_info_elem.text_content()).strip()
                # "대원씨아이 · 2021년 10월 05일" 형식
                parts = publish_text.split('·')
                if len(parts) == 2:
                    metadata['publisher'] = parts[0].strip()
                    date_text = parts[1].strip()
                    # "2021년 10월 05일" → "2021-10-05" 변환
                    date_match = re.search(r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일', date_text)
                    if date_match:
                        year, month, day = date_match.groups()
                        metadata['publication_date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    else:
                        metadata['publication_date'] = date_text
                elif len(parts) == 1:
                    # · 구분자가 없으면 전체를 출판일로 간주
                    date_text = parts[0].strip()
                    date_match = re.search(r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일', date_text)
                    if date_match:
                        year, month, day = date_match.groups()
                        metadata['publication_date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    else:
                        metadata['publication_date'] = date_text

            # 가격
            price_elem = await page.query_selector('.sell_price .val')
            if price_elem:
                price_text = (await price_elem.text_content()).strip()
                # 숫자만 추출
                price_digits = re.sub(r'[^\d]', '', price_text)
                if price_digits:
                    metadata['price'] = int(price_digits)

            # ISBN (이미지 URL에서 추출)
            # 교보문고 이미지 URL 패턴: https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/9791136287489.jpg
            if 'image' in existing_metadata:
                isbn_from_url = re.search(r'/pdt/(\d{13})\.', existing_metadata['image'])
                if isbn_from_url:
                    metadata['isbn'] = isbn_from_url.group(1)

            # 페이지 텍스트에서도 시도
            if 'isbn' not in metadata:
                isbn_elem = await page.query_selector('.info_detail_wrap')
                if isbn_elem:
                    info_text = await isbn_elem.text_content()
                    # 13자리 ISBN 우선 검색
                    isbn_match = re.search(r'ISBN[:\s]*(\d{13})', info_text)
                    if not isbn_match:
                        # 10자리 ISBN
                        isbn_match = re.search(r'ISBN[:\s]*(\d{10})', info_text)
                    if isbn_match:
                        metadata['isbn'] = isbn_match.group(1)

            # 책 설명 (개행문자와 연속 공백 제거)
            desc_elem = await page.query_selector('.intro_bottom')
            if desc_elem:
                desc_text = (await desc_elem.text_content()).strip()
                # 개행문자와 연속 공백을 단일 공백으로 변환
                desc_text = re.sub(r'\s+', ' ', desc_text)
                metadata['description'] = desc_text

            # 페이지수 추출 (전체 페이지에서 "n쪽" 패턴 찾기)
            page_content = await page.content()
            pages_match = re.search(r'(\d+)\s*쪽', page_content)
            if pages_match:
                try:
                    page_count = int(pages_match.group(1))
                    metadata['page_count'] = page_count
                    metadata['pages'] = page_count  # 하위 호환성
                except (ValueError, AttributeError):
                    pass

            # 카테고리 추출 (breadcrumb에서 두 번째 레벨 - 국내도서 > 만화/소설 등)
            breadcrumb_list = await page.query_selector('.breadcrumb_list')
            if breadcrumb_list:
                # data-id 속성이 있는 breadcrumb_item들 가져오기
                active_items = await breadcrumb_list.query_selector_all('.breadcrumb_item[data-id]')
                if len(active_items) >= 2:
                    # 두 번째 카테고리 (국내도서 다음 레벨)
                    second_item = active_items[1]
                    link = await second_item.query_selector('a')
                    if link:
                        cat_text = (await link.text_content()).strip()
                        if cat_text:
                            metadata['category'] = cat_text

        except Exception as e:
            logger.warning(f"교보문고 파싱 오류: {e}")

        return metadata

    async def _parse_aladin(self, soup: BeautifulSoup, page: Page) -> Dict[str, Any]:
        """알라딘 페이지 특화 파싱"""
        metadata = {}

        try:
            # 책 제목
            title_elem = await page.query_selector('.prod_title')
            if title_elem:
                metadata['title'] = (await title_elem.text_content()).strip()

            # 저자 정보 (여러 저자 가능)
            author_elems = await page.query_selector_all('.Ere_prod_author_box a')
            if author_elems:
                authors = []
                for elem in author_elems:
                    text = (await elem.text_content()).strip()
                    if text and '(' not in text:  # 역할 설명 제외
                        # HTML 엔티티 디코딩
                        import html
                        text = html.unescape(text)
                        authors.append(text)
                if authors:
                    metadata['author'] = ', '.join(authors)

            # 출판사
            publisher_elem = await page.query_selector('.Ere_sub_black a')
            if publisher_elem:
                metadata['publisher'] = (await publisher_elem.text_content()).strip()

            # 출판일
            date_elem = await page.query_selector('.Ere_sub_gray:has-text("출간일")')
            if date_elem:
                date_text = (await date_elem.text_content()).strip()
                # "출간일: 2008-03-18" 형식
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', date_text)
                if date_match:
                    metadata['publication_date'] = date_match.group(1)

            # 가격
            price_elem = await page.query_selector('.Ere_prod_price .val')
            if price_elem:
                price_text = (await price_elem.text_content()).strip()
                # "4,950원" 형식에서 숫자만 추출
                price_digits = re.sub(r'[^\d]', '', price_text)
                if price_digits:
                    metadata['price'] = int(price_digits)

            # ISBN (13자리 우선, 페이지 전체에서 검색)
            # 알라딘은 여러 곳에 ISBN이 있을 수 있음
            page_content = await page.content()
            # 13자리 ISBN 우선 검색
            isbn_match = re.search(r'ISBN[:\s]*(\d{13})', page_content)
            if not isbn_match:
                # 10자리 ISBN
                isbn_match = re.search(r'ISBN[:\s]*(\d{10})', page_content)
            if isbn_match:
                metadata['isbn'] = isbn_match.group(1)

            # 책 설명 (여러 요소 시도, 개행문자와 연속 공백 제거)
            desc_selectors = [
                '#divContentTab1',  # 책 소개
                '.Ere_prod_mconts_T',
                '.book_summary_wrap'
            ]
            for selector in desc_selectors:
                desc_elem = await page.query_selector(selector)
                if desc_elem:
                    desc_text = (await desc_elem.text_content()).strip()
                    if desc_text and len(desc_text) > 20:
                        # 개행문자와 연속 공백을 단일 공백으로 변환
                        desc_text = re.sub(r'\s+', ' ', desc_text)
                        metadata['description'] = desc_text
                        break

            # 페이지수 추출 (전체 페이지에서 "n쪽" 패턴 찾기)
            page_content = await page.content()
            pages_match = re.search(r'(\d+)\s*쪽', page_content)
            if pages_match:
                try:
                    page_count = int(pages_match.group(1))
                    metadata['page_count'] = page_count
                    metadata['pages'] = page_count  # 하위 호환성
                except (ValueError, AttributeError):
                    pass

            # 카테고리 추출 - 알라딘은 구조가 복잡하여 생략
            # TODO: 알라딘 카테고리 추출 로직 개선 필요

        except Exception as e:
            logger.warning(f"알라딘 파싱 오류: {e}")

        return metadata


async def scrape_url(url: str) -> Dict[str, Any]:
    """
    단일 URL 스크래핑 (편의 함수)

    Args:
        url: 크롤링할 URL

    Returns:
        메타데이터 딕셔너리
    """
    async with WebScraper() as scraper:
        return await scraper.scrape_url(url)


async def scrape_urls(urls: list[str]) -> list[Dict[str, Any]]:
    """
    여러 URL 스크래핑 (배치 처리)

    Args:
        urls: 크롤링할 URL 리스트

    Returns:
        메타데이터 딕셔너리 리스트
    """
    async with WebScraper() as scraper:
        tasks = [scraper.scrape_url(url) for url in urls]
        return await asyncio.gather(*tasks, return_exceptions=True)


def apply_field_mapping(
    scraped_data: Dict[str, Any],
    mapping: Dict[str, str],
    ignore_unmapped: bool = False
) -> Dict[str, Any]:
    """
    스크래핑된 데이터에 필드 매핑 적용

    Args:
        scraped_data: 스크래핑된 원본 데이터 {"title": "...", "author": "...", "extra": "..."}
        mapping: 필드 매핑 {"title": "책제목", "author": "저자명"}
        ignore_unmapped: True면 매핑되지 않은 필드 무시, False면 원래 키로 유지

    Returns:
        매핑된 데이터
        - ignore_unmapped=False: {"책제목": "...", "저자명": "...", "extra": "..."}
        - ignore_unmapped=True: {"책제목": "...", "저자명": "..."}
    """
    if not mapping:
        return scraped_data

    mapped_data = {}
    for scraped_key, value in scraped_data.items():
        # 매핑이 있는 경우
        if scraped_key in mapping:
            target_key = mapping[scraped_key]
            if target_key:  # 빈 문자열이 아닌 경우만
                mapped_data[target_key] = value
        # 매핑이 없는 경우
        elif not ignore_unmapped:
            # 매핑 안 된 필드는 원래 키로 유지
            mapped_data[scraped_key] = value
        # else: ignore_unmapped=True면 이 필드는 무시됨

    return mapped_data
