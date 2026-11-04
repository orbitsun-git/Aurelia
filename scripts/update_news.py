"""허용된 RSS/Atom에서 제목/출처/링크만 수집. 본문/사진은 재게시하지 않음."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlparse
from datetime import datetime,timezone
from email.utils import parsedate_to_datetime
import json,xml.etree.ElementTree as ET,sys
ROOT=Path(__file__).resolve().parents[1]
def date_value(raw):
    if not raw:return None
    try:return parsedate_to_datetime(raw).astimezone(timezone.utc).isoformat()
    except (ValueError,TypeError):
        try:return datetime.fromisoformat(raw.replace('Z','+00:00')).astimezone(timezone.utc).isoformat()
        except ValueError:return None

def collect():
    sources=json.loads((ROOT/'news-sources.json').read_text())['sources']
    if not sources:raise RuntimeError('news-sources.json에 사용 허가된 HTTPS RSS 주소와 언론사명을 등록하세요.')
    items=[];seen=set();success=0
    for source in sources:
        try:
            if urlparse(source['url']).scheme!='https':raise ValueError('HTTPS만 허용')
            with urlopen(Request(source['url'],headers={'User-Agent':'AureliaNews/1.0'}),timeout=20) as response:
                raw=response.read(2_000_001)
                if len(raw)>2_000_000:raise ValueError('피드 크기 초과')
            root=ET.fromstring(raw);success+=1
            for element in list(root.findall('.//item'))+list(root.findall('.//{http://www.w3.org/2005/Atom}entry')):
                def text(name):return (element.findtext(name) or element.findtext('{http://www.w3.org/2005/Atom}'+name) or '').strip()
                title=text('title');url=text('link')
                if not url:
                    link=element.find('{http://www.w3.org/2005/Atom}link')
                    if link is not None:url=link.get('href','')
                if not title or urlparse(url).scheme!='https' or url in seen:continue
                seen.add(url);items.append({'title':title[:250],'url':url,'source':source['name'],'published_at':date_value(text('pubDate') or text('published') or text('updated'))})
        except Exception as error:print(source.get('name','RSS'),error,file=sys.stderr)
    if not success or not items:raise RuntimeError('수집 실패: 기존 뉴스 파일은 유지됩니다.')
    items.sort(key=lambda x:x['published_at'] or '',reverse=True)
    target=ROOT/'data/news.json';temp=target.with_suffix('.tmp')
    temp.write_text(json.dumps({'updated_at':datetime.now(timezone.utc).isoformat(),'items':items[:8]},ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(target)
if __name__=='__main__':collect()
