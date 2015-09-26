# Call vendor to add the dependencies to the classpath
import vendor
vendor.add('lib')

# Import the Flask Framework
from flask import Flask, render_template, url_for, request, jsonify
app = Flask(__name__)

import translate


# Root directory
@app.route('/')
def index_route():
	phrase = request.args.get("q")
	if not phrase:
		return render_template("index.html", phrase="")

	return render_template("index.html", phrase=phrase)

@app.route("/translate")
def translate_route():
	phrase = request.args.get("text")
	fro = request.args.get("from")
	to = request.args.get("to")

	translated_text = translate.get_translation(phrase, lang=fro + "-" + to)
	if translated_text == None:
		return "Failed to translate", 404

	return translated_text


if __name__ == '__main__':
    #app.run(host="0.0.0.0") # For development
    app.run() # For production