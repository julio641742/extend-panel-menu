# Basic Makefile
UUID = extend-panel-menu@julio641742
BASE_MODULES = convenience.js extension.js LICENSE menuItems.js metadata.json prefs.js README.md stylesheet.css 
INSTALLBASE = ~/.local/share/gnome-shell/extensions
INSTALLNAME = extend-panel-menu@julio641742

all: extension

clean:
	rm -f ./schemas/gschemas.compiled

extension: ./schemas/gschemas.compiled

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.extend-panel-menu.gschema.xml
	glib-compile-schemas ./schemas/

install: install-local

install-local: build
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r ./_build/* $(INSTALLBASE)/$(INSTALLNAME)/
	-rm -fR _build
	echo done

build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
