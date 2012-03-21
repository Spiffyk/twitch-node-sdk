NODE_BIN = ./node_modules/.bin/
TESTS = test/*.js
SRC = lib/twitch.core.js \
	lib/twitch.storage.js \
	lib/twitch.init.js \
	lib/twitch.auth.js

all: twitch.min.js

test:
	open test/index.html

twitch.js: $(SRC)
	cat $^ > $@

twitch.min.js: twitch.js
	$(NODE_BIN)uglifyjs --no-mangle $< > $@

clean:
	rm -f twitch{,.min}.js

.PHONY: test