tryethereum
===========

Try Ethereum with an online interface.

### Running
- Install nodejs, npm, mongo-db
- Run "npm install" and mongod
- node server.js
- Clone and build https://github.com/ethereum/pyethereum.  Make pyethtool globally accessible (eg create symlink /usr/local/bin/pyethtool)
- Clone and build https://github.com/ethereum/serpent
- In browser go to http://localhost:3000

For example:

1. Enter cow for seed
2. Click "Gimme more money"
3. Get the namecoin contract written in serpent from http://blog.ethereum.org/2014/04/10/pyethereum-and-serpent-programming-guide-2 and submit it. Note the address of the contract, let's call it NAMECOIN_ADDRESS.
4. In "State Explorer" enter NAMECOIN_ADDRESS to see your namecoin contract
5. Submit Transaction to NAMECOIN_ADDRESS with value 0 and data "harry 60" (no quotes)
6. In "State Explorer" you should see your data will now be in storage "1734439545 60"

Try out other stuff and if you want to reset (genesis block), delete it from mongo eg. db.block.remove({})
