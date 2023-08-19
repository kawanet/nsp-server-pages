#!/usr/bin/env bash -c make

all: ./src/app.js ./cjs/src/app.js

test: test-title test-esm test-cjs

test-esm: ./test/000.before.js
	./node_modules/.bin/mocha test/*.js

test-cjs: ./cjs/test/000.before.js
	./node_modules/.bin/mocha cjs/test/*.js

./src/%.js: ./src/%.ts
	./node_modules/.bin/tsc -p tsconfig.json

./test/%.js: ./test/%.ts
	./node_modules/.bin/tsc -p tsconfig.json

./cjs/src/%.js: ./src/%.ts
	./node_modules/.bin/tsc -p tsconfig-cjs.json

./cjs/test/%.js: ./test/%.ts
	./node_modules/.bin/tsc -p tsconfig-cjs.json

test-title:
	perl -i -pe '@f = split("/",$$ARGV); s#^const TITLE =.*#const TITLE = "$$f[-1]";#' ./test/*.ts

clean:
	/bin/rm -fr ./src/*.js ./test/*.js ./cjs/*/*.js

.PHONY: all clean test
