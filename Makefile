NODE_BIN = ./node_modules/.bin/
TESTS = test/*.js
SRC = lib/twitch.core.js \
	lib/twitch.storage.js \
	lib/twitch.init.js \
	lib/twitch.auth.js \
	lib/twitch.events.js

all: twitch.js docs

test: twitch.js
	node test/server.js

docs: twitch.js
	$(NODE_BIN)docco twitch.js
	mv docs docco

twitch.js: $(SRC)
	cat $^ > $@

clean:
	rm -f twitch.js

.PHONY: test docs
