/*jshint asi:true*/
angular.module('tryethereum', []);

function TryEthereumCtrl($scope,$http) {
    window.wscope = $scope;
    $scope.dequote = function(s) {
        if (s[0] == '"') {
            return s.substring(1,s.length-1)
        }
    }
    $scope.errlogger = function(r) {
        $scope.error = r.data || r;
        $scope.response = ''
        throw r;
    }
    $scope.serpent = function(arg,data) {
        $http.post('/serpent/'+arg,{ data: data })
             .success(function(r) {
		         $scope.response = r.replace(/"/g,'')
                 $scope.error = ''
             })
             .error(function(r) {
		         $scope.error = 'compilation error: '+r
                 $scope.response = ''
             })
    }
    $scope.pyethtool = function(cmd, args) {
        q = ''
        c = 0
        for (var a in args) {
            q += c+'='+a+'&'
        }
        q = q.substring(0,q.length-1)
        $http.get('/pyethtool/'+cmd+'?'+q)
             .success(function(r) {
		         $scope.response = r.replace(/"/g,'')
                 $scope.error = ''
             })
             .error($scope.errlogger)
    }
    $scope.alloc = function(addr, amount) {
        $http.post('/alloc',{ addr: addr, amount: amount })
            .success(function(r) {
                $scope.response = "Allocated "+amount+" to "+addr
                $scope.error = ''
                $scope.fetchdata($scope.address,'account')
                $scope.fetchdata($scope.search_address,'search_account')
            })
            .error($scope.errlogger)
    }
    $scope.applytx = function(tx) {
        $http.post('/applytx',{ data: tx })
            .success(function(r) {
                $scope.response = r.response
                $scope.error = ''
                $scope.fetchdata($scope.address,'account')
                $scope.fetchdata($scope.search_address,'search_account')
            })
            .error($scope.errlogger)
    }
    $scope.sendtx = function(key, nonce, value, to, data) {
        var dArr = data.split(' ').map(function(x) {
            var int = parseInt(x, 10);
            return int ? int : x;
        });
        var encodedData = Ethereum.serpent.compiler.encodeDataList(dArr);
        var tx = Ethereum.transaction.mktx(
                                Ethereum.BigInteger(''+nonce),
                                to,
                                Ethereum.BigInteger(''+value),
                                Ethereum.util.encodeHex(encodedData));
        //console.log('mktx: ', tx);

        var parsedTx = Ethereum.transaction.hex_deserialize(tx);
        //console.log('parsedTx: ', parsedTx);

        var signedTx = Ethereum.transaction.sign(parsedTx, key);
        //console.log('signedTx: ', signedTx);

        var signedData = Ethereum.transaction.hex_serialize(signedTx);

        $http.post('/applytx',{ data: signedData })
             .then(function(r) {
                $scope.response = r.data.response
                $scope.error = ''
                $scope.fetchdata($scope.address,'account')
                $scope.fetchdata($scope.search_address,'search_account')
             },$scope.errlogger)
    }
    $scope.contract = function(nonce, endowment, code) {
        $http.post('/serpent/compile',{ data: code })
             .then(function(codehex) {
                var ct = Ethereum.transaction.mkContract(
                                        Ethereum.BigInteger(''+nonce),
                                        Ethereum.BigInteger(''+endowment),
                                        $scope.dequote(codehex.data));
                var parsedTx = Ethereum.transaction.parse(
                                    Ethereum.util.decodeHex(ct));
                var signedTx = Ethereum.transaction.sign(parsedTx, $scope.key);
                return $http.post('/applytx',{ data: signedTx })
             },$scope.errlogger)
             .then(function(r) {
                console.log(r.data)
                $scope.fetchdata($scope.address,'account')
                $scope.fetchdata($scope.search_address,'search_account')
                $scope.response = "Contract address: "+r.data.response
             },$scope.errlogger)
    }
    $scope.genseed = function() {
        $scope.seed = encodeURIComponent((''+Math.random()).substring(2)+''+new Date().getTime())
    }
    $scope.genkey = function() {
        $scope.key = Ethereum.util.encodeHex(Ethereum.util.sha3($scope.seed));
        $scope.address = Ethereum.util.privToAddr($scope.key);
    }
    $scope.$watch('seed',$scope.genkey)
    $scope.fetchdata = function(address,dest) {
        $http.get('/account_to_dict?address='+address)
            .success(function(r) {
                $scope[dest] = r
            })
    }
    $scope.$watch('address',function() { $scope.fetchdata($scope.address,'account') })
    $scope.$watch('search_address',function() { $scope.fetchdata($scope.search_address,'search_account') })

    $scope.seed = ''
}
