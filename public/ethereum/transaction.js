var transaction = (function() {
    var encode_int = util.intToBigEndian;
    var decode_int = util.bigEndianToInt;

    function mktx(nonce, value, to, data) {
        var opts = {
            nonce: nonce,
            value: value,
            gasprice: util.bigInt(Math.pow(10, 12)),
            startgas: util.bigInt(10000),
            to: to,
            data: util.decodeHex(data)
        };

        return util.encodeHex(
                serialize(makeTransaction(opts), false));
    }

    function serialize(tx, isSigned) {
        var arr = [encode_int(tx.nonce),
                           encode_int(tx.value),
                           encode_int(tx.gasprice),
                           encode_int(tx.startgas),
                           util.coerce_addr_to_bin(tx.to),
                           tx.data,
                           encode_int(tx.v),
                           encode_int(tx.r),
                           encode_int(tx.s)];
        var forRlp = isSigned ? _.take(arr, 9) : _.take(arr, 6);
        return rlp.encode(forRlp);
    }

    // 'constructor'
    function makeTransaction(opts) {
//        TODO handle when a signature exists
//        if (_.key(opts).length > 7) {
//            throw new Error('TODO makeTransaction');
//        }
        return {
            nonce: opts.nonce,
            value: opts.value,
            gasprice: opts.gasprice,
            startgas: opts.startgas,
            to: util.coerce_addr_to_bin(opts.to),
            data: opts.data,

            v: Bitcoin.BigInteger.ZERO,
            r: Bitcoin.BigInteger.ZERO,
            s: Bitcoin.BigInteger.ZERO,
            sender: 0
        }
    }

    function sign(tx, key) {
        return util.encodeHex(serialize(__sign(tx, key), true));
    }

    function __sign(tx, key) {
        var binaryForCryptoJs = CryptoJS.enc.Latin1.parse(
                                    rlp.encode(serialize(tx, false)));
        var wordArray = util.sha3(binaryForCryptoJs);
        var rawhash = Bitcoin.convert.wordArrayToBytes(wordArray);

        // false flag important since key is uncompressed
        var ecKey = Bitcoin.ECKey.fromHex(key, false);
        var sig = ecKey.sign(rawhash);
        var parsedSig = Bitcoin.ecdsa.parseSig(sig);

        var iVal = my_calcPubkeyRecoveryParam(ecKey,
                        parsedSig.r, parsedSig.s, rawhash);

        tx.v = util.bigInt(27 + iVal);  // TODO i%2 like in main.py ?
        tx.r = parsedSig.r;
        tx.s = parsedSig.s
        tx.sender = util.privToAddr(key);

        return tx;
    }

    // idea from BitcoinJS calcPubkeyRecoveryParam()
    function my_calcPubkeyRecoveryParam(key, r, s, hash) {
        var pubKeyHex = key.pub.toHex();

        for (var i=0; i<4; i++) {
            if (Bitcoin.convert.bytesToHex(
                    Bitcoin.ecdsa.recoverPubKey(r, s, hash, i)
                        .getEncoded()) === pubKeyHex) {
                return i;
            }
        }

        throw new Error("Unable to find valid recovery factor");
    }

    function parse(data) {
        if (data.match(/^[0-9a-fA-F]*$/)) {
            data = util.decodeHex(data);
        }

        var o = rlp.decode(data).concat(['','','']);

        var opts = {
            nonce: decode_int(o[0]),
            value: decode_int(o[1]),
            gasprice: decode_int(o[2]),
            startgas: decode_int(o[3]),
            to: util.encodeHex(o[4]),
            data: o[5],
            v: decode_int(o[6]),
            r: decode_int(o[7]),
            s: decode_int(o[8])
        };

        return makeTransaction(opts);
    }

    return {
        mktx: mktx,
        sign: sign,
        parse: parse
    }
})();
