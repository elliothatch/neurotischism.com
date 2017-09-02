Bootstrapping the build process:
maybe just the build script (that does stuff like npm install) to trigger BuildManager. log output to console
I'd rather you can navigate to ~config, which detects that this is a first time run and somehow gives you a fully featured build manager without being built
socketio is provided by server, so we can always trigger the build and just have simplified reporting instead of full build manager.
even simpler, add a special socket build endpoint that only builds the config stuff. Probably the best idea <-


Dynamically load plugins:
We can have plugins go in a "plugin" directory. Installing a plugin involves copying/cloning the plugin and triggering an "installPlugin" function. installPlugin
dynamically 'require's the new plugin, installs express routers and freshr middleware, adds config, and builds the plugin's tasks.

plugins should have standardized interface that supports:
1. freshr middleware - can add data to context
2. express router - can add new routes
3. config - dynamic configuration data
4. build tasks - plugins must be able to build themselves through the BuildManager. this should only be required on installation/update

1. freshr middleware
this is straightforward

2. express router
preFreshrMiddleware and postFreshrMiddleware routers, at runtime we can `router.use` to add middleware, can find solution to remove routes
e.g.: premiddleware to add POST comments, postmiddleware to add 404 page

3. config
configs should probably just be json. plugins can specify field name, data type, custom validator (serverside, clientside, both?), . future idea--plugins can also provide client code for validator+data selector e.g. color picker

4. build tasks
add support for plugins to add and remove build tasks
THE BIGGEST ISSUE HERE IS THAT PLUGINS CAN HAVE NPM DEPENDENCIES THAT AREN'T INSTALLED--will that be a problem or can we trigger npm easily through node? maybe this is the case
where we want to spawn a shell task as part of the install/build step
SHOULD PLUGINS HAVE THEIR OWN NODE_MODULES (and make plugin developers explicilty 'require' with relative paths). This addresses the issue of multiple version of the same module,
but causes annoyences for plugin devs and duplicated dependencies. maybe prevents shared state issues between modules.

support plugins in templating engine (we can force reload all templates, including plugins folder, or only trigger loading templates in plugin. Probably better to separate plugin
loading from user pages loading... and build steps. users only want a plugin to build when it's installed/updated, don't care about seeing the build tasks run (except on install)

takeaway: plugins should use existing template and build frameworks--but they should be logically separated
this should be easy, because we can just have each plugin provide a base task and call "buildProject" with it. user code should never rely on unbuilt plugin code (note that everything
templating related is combined at rendering step, so the user should be able to use helpers and partials from plugins without extra work)


