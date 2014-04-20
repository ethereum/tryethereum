var express         = require('express'),
    cp              = require('child_process'),
    async           = require('async'),
    _               = require('underscore'),
    fs              = require('fs'),
    db              = require('./db')

var eh = function(fail, success) {
    return function(err, res) {
        if (err) {
            console.log('e',err,'f',fail,'s',success);
            if (fail) { fail(err); }
        }
        else {
            success.apply(this,Array.prototype.slice.call(arguments,1));
        }
    };
};

var mkrespcb = function(res,code,success) {
    return eh(function(e) { res.json(e,code); },success);
}

var app = express();

app.configure(function(){
    app.set('views',__dirname + '/views');
    app.set('view engine', 'jade'); app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

var block = null;

// Prevent multiple pyethtool processes from locking each other up, by queuing them

var processQueue = []
var running = false;

var callProc = function(cmd, med, cb) {
    processQueue.push({ cmd: cmd, med: med, cb: cb })
    if (!running) runProcessQueue()
}

var runProcessQueue = function() {
    running = true;
    if (processQueue.length == 0) {
        running = false;
        return;
    }
    var first = processQueue.pop()
    var cb = function(med, origcb) {
        return function(err,res) {
            if (err || !med) {
                origcb(err, res)
                runProcessQueue()
            }
            else {
                med(res, function() {
                    origcb(err, res)
                    runProcessQueue()
                })
            }
        }
    }
    cp.exec(first.cmd, cb(first.med, first.cb))
}

// Save latest block header to database

var saveBlock = function(b,cb) {
    db.block.findOne({},eh(cb,function(dbblock) {
        console.log('old',dbblock,'new',b.trim())
        block = b.trim()
        if (!dbblock) { db.block.insert({ data: b.trim() },cb) } 
        else { db.block.update({},{ data: b.trim() },cb) }
    }))
}

var alert_error = function(e) {
    console.log(e)
}

var initBlock = function() {
    db.block.findOne({},eh(alert_error,function(dbblock) {
        if (dbblock) {
            console.log('existing block: '+dbblock.data)
            block = dbblock.data
        }
        else {
            console.log('making new block')
            cmd = 'pyethtool mkgenesis'
            callProc(cmd,saveBlock,eh(alert_error,function(r) {
                console.log(r.trim())
            }))
        }
    }))
    
}

setTimeout(initBlock, 1000)

app.use('/alloc',function(req,res) {
    cmd = 'pyethtool alloc "'+block+'" "'+req.param('addr')+'" "'+req.param('amount')+'"'
    callProc(cmd, saveBlock, mkrespcb(res,400,function(r) {
        res.json(r.trim())
    }))
})


app.post('/applytx',function(req,res) {
    cmd = 'pyethtool applytx "'+block+'" "'+req.param('data')+'"'
    var b = {}
    callProc(cmd, function(r,cb) {
        r = r.trim()
        r = ('['+r.substring(1,r.length-1)+']').replace(/'/g,'"')
        r = JSON.parse(r)
        b.block = r[0]
        b.response = r[1]
        saveBlock(r[0],cb)
    }, mkrespcb(res,400,function() {
        res.json(b)
    }))
})

app.get('/account_to_dict',function(req,res) {
    cmd = 'pyethtool account_to_dict "'+block+'" "'+req.param('address')+'"'
    callProc(cmd, null, mkrespcb(res,400,function(r) {
        res.json(JSON.parse(r))
    }))
})

app.get('/pyethtool/:command',function(req,res) {
    data = []
    for (var q in req.query) {
        data.push(req.query[q])
    }
    cmd = 'pyethtool "' + req.param('command') + '" "' + data.join('" "') + '"'
    // anti-spam rule
    if (req.param('command') == 'applytx') {
        data[2] = '0'
        data[3] = '10000'
    }
    callProc(cmd, null, mkrespcb(res,400,function(r) {
        res.json(r.trim())
    }))
})

app.post('/serpent/:command',function(req,res) {
    console.log(req.param('data'))
    var filename = '/tmp/'+Math.random()
    fs.writeFile(filename,req.param('data'),mkrespcb(res,400,function() {
        cmd = 'serpent "' + req.param('command') + '" "' + filename + '"'
        console.log(cmd)
        cp.exec(cmd,mkrespcb(res,400,function(r) {
            res.json(r.trim())
        }))
    }))
});

app.get('/',function(req,res) {
    res.render('app.jade',{});
});

app.listen(3000);

return app;

