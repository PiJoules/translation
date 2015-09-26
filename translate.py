# Call vendor to add the dependencies to the classpath
import vendor
vendor.add('lib')

import requests
from key import key

"""
https://translate.yandex.net/api/v1.5/tr.json/translate?key=APIkey&lang=en-ru&text=To+be,+or+not+to+be%3F&text=That+is+the+question.
"""

def get_translation(phrase, lang="en-ja"):
	payload = {
		"key": key,
		"lang": lang,
		"text": [phrase]
	}
	r = requests.get("https://translate.yandex.net/api/v1.5/tr.json/translate", params=payload)
	if r.status_code == requests.codes.ok:
		return r.json()["text"][0]
	return None

if __name__ == "__main__":
	print get_translation("I hope live to in a world where everything is dank memes.")