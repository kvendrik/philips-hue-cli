Philips Hue CLI
===============

A simple CLI to control the Philips Hue lights and manage its users.

### Using the CLI
Clone this repo, move into the folder and run the init command. This will walk you through the steps of setting up the CLI with your bridge.
```
git clone https://github.com/kvendrik/philips-hue-cli.git
cd philips-hue-cli
sudo npm install
./hue init
```

### Help
```
./hue --help
```

### Detailed Manual
```
./hue --manual
```

### Install Globally
If you would like to install the CLI globally so you can use it without having to move into the folder every time then run this when in the folder:
```
sudo npm install -g
```

Then check the installation using:
```
hue -v
```