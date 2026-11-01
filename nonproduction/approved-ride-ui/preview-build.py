from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(Path(__file__).parent/'dist'),**kwargs)
 def do_GET(self):
  if self.path.split('?')[0] in ['/ride','/']: self.path='/index.html'
  return super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8082),Handler).serve_forever()
