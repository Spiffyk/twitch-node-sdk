NODE_BIN = ./node_modules/.bin/
TESTS = test/*.js
SRC = lib/node.pre.js \
	lib/twitch.core.js \
	lib/twitch.init.js \
	lib/twitch.popup.js \
	lib/twitch.auth.js \
	lib/twitch.events.js \
	lib/node.post.js

all: twitch.js docs

docs: twitch.js
	$(NODE_BIN)docco twitch.js
	mv docs docco

twitch.js: $(SRC)
	cat $^ > $@

clean:
	rm -f twitch.js
	rm -R docco

.PHONY: docs
