// depends on CryptoJS and BitcoinJS

var util = (function() {

    function sha3(x) {
        return CryptoJS.SHA3(x, { outputLength: 256 });
    }

    function privToAddr(x) {
        // false flag important since key is uncompressed
        var btcKey = Bitcoin.ECKey.fromHex(x, false);

        var bytes = Bitcoin.convert.hexToBytes(btcKey.pub.toHex()).slice(1);
        var binaryForCryptoJs = CryptoJS.enc.Latin1.parse(
                                    Bitcoin.convert.bytesToString(bytes));

        var addr = util.sha3(binaryForCryptoJs);
        return addr.toString().substr(24);
    }

    function decodeHex(s) {
        return s ?
            Bitcoin.convert.bytesToString(Bitcoin.convert.hexToBytes(s)) : '';
    }

    function encodeHex(s) {
        return Bitcoin.convert.bytesToHex(Bitcoin.convert.stringToBytes(s));
    }

    function zpad(x, l) {
        var s = '';
        var repeat = Math.max(0, l - x.length);
        for (var i=0; i < repeat; i++) {
            s += '\x00';
        }
        return s + x;
    }

    function coerce_addr_to_bin(x) {
        if (x instanceof Bitcoin.BigInteger) {
            return encodeHex(zpad(intToBigEndian(x), 20));
        }
        else if (x.length === 40 || x.length === 0) {
            return decodeHex(x);
        }
        else if (_.isNumber(x)) {
            throw new Error('coerce addr should be BigInteger');
        }
        else {
            return zpad(x, 20).slice(-20);
        }
    }

    // bi is BigInteger
    function intToBigEndian(bi) {
        // 0 is a special case, treated same as ''
        if (bi.equals(Bitcoin.BigInteger.ZERO)) {
            return '';
        }
        var s = bi.toHex();
        if (s.length & 1) {
            s = '0' + s;
        }
        return decodeHex(s);
    }

    function bigEndianToInt(string) {
        // convert a big endian binary string to BigInteger
        // '' is a special case, treated same as 0
        string = string || '\x00';
        var s = encodeHex(string);
        return Bitcoin.BigInteger.fromHex(s);
    }

    function bigInt(n) {
        return Bitcoin.BigInteger.fromHex(
            Bitcoin.convert.reverseEndian(
            Bitcoin.convert.bytesToHex(
            Bitcoin.convert.numToBytes(n))));
    }

    return {
        sha3: sha3,
        privToAddr: privToAddr,
        decodeHex: decodeHex,
        encodeHex: encodeHex,
        coerce_addr_to_bin: coerce_addr_to_bin,
        bigInt: bigInt,
        intToBigEndian: intToBigEndian,
        bigEndianToInt: bigEndianToInt
    }
})();
