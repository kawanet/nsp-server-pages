#!/usr/bin/env bash -c make

all: test-title ./src/app.js ./cjs/src/app.js

test: test-esm test-cjs

test-esm: all
	./node_modules/.bin/mocha test/*.js

test-cjs: all
	./node_modules/.bin/mocha cjs/test/*.js

./cjs/%.js: ./%.ts
	./node_modules/.bin/tsc -p tsconfig-cjs.json

%.js: %.ts
	./node_modules/.bin/tsc -p tsconfig.json

test-title:
	perl -i -pe '@f = split("/",$$ARGV); s#^const TITLE =.*#const TITLE = "$$f[-1]";#' ./test/*.ts

clean:
	/bin/rm -fr ./src/*.js ./test/*.js ./cjs/src/*.js ./cjs/test/*.js

.PHONY: all clean test
