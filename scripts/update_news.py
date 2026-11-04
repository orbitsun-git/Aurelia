"""한국시간 요일별 RSS 수집. 0=월요일, 6=일요일."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
KST = timezone(timedelta(hours=9))
ATOM = '{http://www.w3.org/2005/Atom}'


def date_value(raw):
    if not raw:
        return None
    try:
        value = parsedate_to_datetime(raw)
    except (ValueError, TypeError, OverflowError):
        try:
            value = datetime.fromisoformat(raw.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def select_sources(sources, now):
    weekday = now.astimezone(KST).weekday()
    return [s for s in sources if weekday in s.get('weekdays', [])]


def parse_feed(raw, name):
    root = ET.fromstring(raw)
    items = []
    seen = set()
    for element in root.findall('.//item') + root.findall('.//' + ATOM + 'entry'):
        def text(key):
            return (element.findtext(key) or element.findtext(ATOM + key) or '').strip()
        title = text('title')
        url = text('link')
        if not url:
            for link in element.findall(ATOM + 'link'):
                if link.get('rel', 'alternate') == 'alternate':
                    url = link.get('href', '')
                    break
        if not title or urlparse(url).scheme != 'https' or url in seen:
            continue
        seen.add(url)
        items.append({
            'title': title[:250],
            'url': url,
            'source': name,
            'published_at': date_value(text('pubDate') or text('published') or text('updated'))
        })
    return items


def collect():
    now = datetime.now(timezone.utc)
    config = json.loads((ROOT / 'news-sources.json').read_text(encoding='utf-8'))
    selected = select_sources(config['sources'], now)
    if not selected:
        raise RuntimeError('오늘의 출처가 없습니다. 요일 설정을 확인하세요.')
    items = []
    for source in selected:
        if urlparse(source['url']).scheme != 'https':
            raise ValueError('HTTPS RSS 주소만 사용할 수 있습니다.')
        request = Request(source['url'], headers={'User-Agent': 'AureliaNews/1.0'})
        with urlopen(request, timeout=30) as response:
            raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise ValueError('RSS 크기 제한 초과')
        items.extend(parse_feed(raw, source['name']))
    if not items:
        raise RuntimeError('수집된 글이 없습니다. 기존 뉴스 파일을 유지합니다.')
    items.sort(key=lambda item: item['published_at'] or '', reverse=True)
    unique = []
    urls = set()
    for item in items:
        if item['url'] not in urls:
            unique.append(item)
            urls.add(item['url'])
    target = ROOT / 'data' / 'news.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        'updated_at': now.isoformat(),
        'scheduled_date_kst': now.astimezone(KST).date().isoformat(),
        'items': unique[:8]
    }
    temp = target.with_suffix('.tmp')
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    temp.replace(target)
    print('수집 완료:', ', '.join(s['name'] for s in selected), len(unique[:8]), '개')


if __name__ == '__main__':
    collect()
