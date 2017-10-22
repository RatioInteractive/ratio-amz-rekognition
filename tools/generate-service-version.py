import json
import sys
import re
from datetime import datetime

regex = r"(\d+)\.(\d+)\.(\d)"
with open('package.json') as packageFile:
    d = json.load(packageFile)
    matches = re.search(regex, d['version'])
    print (matches.group(1) + '.' + matches.group(2) + '.' + datetime.now().strftime('%y%m%d') + '.' + sys.argv[1])
