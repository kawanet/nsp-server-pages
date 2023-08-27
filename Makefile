#!/usr/bin/env bash -c make

all: test-title esm/index.js cjs/index.js esm/test/000.before.js cjs/test/000.before.js

test: test-esm test-cjs

test-esm: all
	./node_modules/.bin/mocha esm/test/*.js

test-cjs: all
	./node_modules/.bin/mocha cjs/test/*.js

cjs/%.js: ./%.ts
	./node_modules/.bin/tsc -p tsconfig-cjs.json

esm/%.js: ./%.ts
	./node_modules/.bin/tsc -p tsconfig.json

test-title:
	perl -i -pe '@f = split("/",$$ARGV); s#^const TITLE =.*#const TITLE = "$$f[-1]";#' ./test/*.ts

clean:
	/bin/rm -fr esm/*/ cjs/*/ esm/*.js cjs/*.js

.PHONY: all clean test
