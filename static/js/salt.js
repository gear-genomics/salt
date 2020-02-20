const resultLink = document.getElementById('link-results')

const loadRefButton = document.getElementById('inputFileRef')
loadRefButton.addEventListener('change', loadRefFile, false);

const loadQueryButton = document.getElementById('inputFileQuery')
loadQueryButton.addEventListener('change', loadQueryFile, false);

const startCountButton = document.getElementById('startCount')
startCountButton.addEventListener('change', fixStartCount);

const saveResButton = document.getElementById('btn-save')
saveResButton.addEventListener('click', saveResults);

const saveFastaButton = document.getElementById('btn-save-fa')
saveFastaButton.addEventListener('click', saveFasta);

const revCompQueryButton = document.getElementById('reverseQueryBtn')
revCompQueryButton.addEventListener('click', revCompQuery)

const submitButton = document.getElementById('btn-submit')
submitButton.addEventListener('click', do_align)

const exampleButton = document.getElementById('btn-example')
exampleButton.addEventListener('click', showExample)

window.queryIsReverse = false;
window.saveReference = "";
window.saveQuery = "";

$('#mainTab a').on('click', function(e) {
  e.preventDefault()
  $(this).tab('show')
})

function fixStartCount() {
    var star = parseInt(document.getElementById('startCount').value);
    if (star == 0) {
        document.getElementById('startCount').value = 0;
    } else {
        document.getElementById('startCount').value = 1;
    }
}

function loadRefFile(f) {
    var file = f.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(event) {
            var txt = event.target.result;
            document.getElementById("target").value = loadSeqFile(txt);
        }
        reader.readAsText(file);
    } else {
        alert("Error opening file");
    }
}

function loadQueryFile(f) {
    var file = f.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(event) {
            var txt = event.target.result;
            document.getElementById("query").value = loadSeqFile(txt);
        }
        reader.readAsText(file);
    } else {
        alert("Error opening file");
    }
}

function loadSeqFile(txt) {
    txt = txt.replace(/\r\n/g, "\n");
    txt = txt.replace(/\r/g, "\n");
    txt = txt.replace(/^\s*/, "");
    var fileLines = txt.split('\n');
    var seq = "";

    if (txt.match(/^>/) != null) {
        // Read Fasta
        var add = true;
        for (var i = 1; i < fileLines.length; i++) {
            if ((fileLines[i].match(/^>/) == null) && (add == true)){
                seq += fileLines[i];
            } else {
                add = false;
            }
        }
    } else if (txt.match(/^\^\^/) != null) {
        // Read SeqEdit (not tested!)
        seq = txt.replace(/^\^\^/, "");
    } else if ((txt.match(/ORIGIN/) != null) && (txt.match(/LOCUS/) != null)) {
        // Read GeneBank
        var add = false;
        for (var i = 0; i < fileLines.length; i++) {
            if (fileLines[i].match(/^ORIGIN/) != null) {
                add = true;
            } else if (fileLines[i].match(/^\/\//) != null) {
                add = false;
            } else if (add == true) {
                seq += fileLines[i].replace(/\d+/g, "");
            }
        }
    } else if ((txt.match(/Sequence/) != null) && (txt.match(/SQ/) != null)) {
        // Read EMBL
        var add = false;
        for (var i = 0; i < fileLines.length; i++) {
            if (fileLines[i].match(/^SQ/) != null) {
                add = true;
            } else if (fileLines[i].match(/^\/\//) != null) {
                add = false;
            } else if (add == true) {
                seq += fileLines[i].replace(/\d+/g, "");
            }
        }
    } else {
        // Read file plain txt
        seq = txt;
    }
    seq = seq.replace(/\d+/g, "");
    seq = seq.replace(/\W+/g, "");
    return seq;
}

function detectBrowser() {
    var browser = window.navigator.userAgent.toLowerCase();
    if (browser.indexOf("edge") != -1) {
        return "edge";
    }
    if (browser.indexOf("firefox") != -1) {
        return "firefox";
    }
    if (browser.indexOf("chrome") != -1) {
        return "chrome";
    }
    if (browser.indexOf("safari") != -1) {
        return "safari";
    }
    alert("Unknown Browser: Functionality may be impaired!\n\n" + browser);
    return browser;
}

function saveResults() {
    var content = document.getElementById('out').innerHTML;
    if (content == "") {
        return;
    }

	var ms   = parseInt(document.getElementById('match').value);
	var mms  = parseInt(document.getElementById('mismatch').value);
	var gapo = parseInt(document.getElementById('gapo').value);
	var gape = parseInt(document.getElementById('gape').value);
	var is_local = document.getElementById('is_local').checked;
	var startCount = parseInt(document.getElementById('startCount').value);
    content += "\nSettings:\n"
    content += "local alignment: "
    if (is_local) {
        content += "yes\n"
    } else {
        content += "no\n"
    }
    content += "Match Score: " + ms + "\n"
    content += "Mismatch: " + mms + "\n"
    content += "Gap Open: " + gapo + "\n"
    content += "Gap Extension: " + gape + "\n"
    content += "Start Count: " + startCount + "\n"

    content += "\nReference Sequence:\n"
    var target = document.getElementById("target").value;
	var linelen = 100;
	for (var l = 0; l < target.length; l += linelen) {
		content += target.substr(l, linelen) + '\n';
	}

    content += "\nQuery Sequence:\n"
    var query = document.getElementById("query").value;
	var linelen = 100;
	for (var l = 0; l < query.length; l += linelen) {
		content += query.substr(l, linelen) + '\n';
	}

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    var blob = new Blob([content], {type: "text/plain"});
    var browser = detectBrowser();
    if (browser != "edge") {
	    var url = window.URL.createObjectURL(blob);
	    a.href = url;
	    a.download = "alignment.txt";
	    a.click();
	    window.URL.revokeObjectURL(url);
    } else {
        window.navigator.msSaveBlob(blob, "alignment.txt");
    }
    return;
};

function saveFasta() {
    if (window.saveReference == "") {
        return;
    }
    var content = "> Reference Sequence\n";
    var linelen = 80;
    for (var l = 0; l < window.saveReference.length; l += linelen) {
		content += window.saveReference.substr(l, linelen) + '\n';
	}
    content += "\n> Query Sequence\n";
    for (var l = 0; l < window.saveQuery.length; l += linelen) {
		content += window.saveQuery.substr(l, linelen) + '\n';
	}
    content += "\n";

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    var blob = new Blob([content], {type: "text/plain"});
    var browser = detectBrowser();
    if (browser != "edge") {
	    var url = window.URL.createObjectURL(blob);
	    a.href = url;
	    a.download = "alignment.fa";
	    a.click();
	    window.URL.revokeObjectURL(url);
    } else {
        window.navigator.msSaveBlob(blob, "alignment.fa");
    }
    return;
};

function revCompQuery() {
    if (window.queryIsReverse == false) {
        window.queryIsReverse = true;
    } else {
        window.queryIsReverse = false;
    }
    document.getElementById('query').value = ks_revcomp(document.getElementById('query').value);
}

function writePadInt(nr, pos) {
    var ret = "";
    var numbPos = 1;
    if (nr > 0) {
        numbPos = Math.floor(Math.log10(nr)) + 1;
    }
    if (nr < 0) {
        numbPos = Math.floor(Math.log10(-1 * nr)) + 2;
    }
    var spaceAdd = pos - numbPos;
    for (var i = 0 ; i < spaceAdd ; i++) {
        ret += " "
    }
    ret += nr + "  ";
    return ret;
}

function writePadSpace(pos) {
    var ret = "";
    for (var i = 0 ; i < pos ; i++) {
        ret += " "
    }
    ret += "  ";
    return ret;
}

function do_align() {
	var target = document.getElementById('target').value.replace(/[\d\s\n]+/g, '');
	var query  = document.getElementById('query').value.replace(/[\d\s\n]+/g, '');
    if ((target == "") || (query == "")) {
        alert("Salt requires a reference and a query sequence!");
        return;
    }

	resultLink.click();
	var time_start = new Date().getTime();

	var ms   = parseInt(document.getElementById('match').value);
	var mms  = parseInt(document.getElementById('mismatch').value);
	var gapo = parseInt(document.getElementById('gapo').value);
	var gape = parseInt(document.getElementById('gape').value);
	var is_local = document.getElementById('is_local').checked;
	var startCount = parseInt(document.getElementById('startCount').value);

	var rst = bsa_align(is_local, target, query, [ms, mms], [gapo, gape]);
	var str = 'Alignment Score: ' + rst[0] + '\n';
	str += 'Alignment Start: ' + (parseInt(rst[1]) + startCount) + '\n';
	var cigarStr = bsa_cigar2str(rst[2])
	str += 'Cigar String: ' + cigarStr + '\n\n';
	str += 'Alignment:\n\n';
	var fmt = bsa_cigar2gaps(target, query, rst[1], rst[2]);

	var numbPos = Math.ceil(Math.log10(target.length));
	var numbPosQuer = Math.ceil(Math.log10(target.length));
	if (numbPos < numbPosQuer) {
	    numbPos = numbPosQuer;
	}
	var nrTar = parseInt(rst[1]) + startCount;
	var nrQuery = startCount;

    if (window.queryIsReverse == true) {
        nrQuery = query.length;
        if (cigarStr != "") {
            var myRegexp = /.+[a-zA-Z]+([0-9]+)([a-zA-Z]+)$/g;
            var match = myRegexp.exec(cigarStr);
            if ((match[2] == "S") || (match[2] == "H")) {
                nrQuery -= parseInt(match[1])
            }
        }
    } else {
        if (cigarStr != "") {
            var myRegexp = /^([0-9]+)([a-zA-Z]+).+/g;
            var match = myRegexp.exec(cigarStr);
            if ((match[2] == "S") || (match[2] == "H")) {
                nrQuery += parseInt(match[1])
            }
        }
    }

	var linelen = 100;
    window.saveReference = fmt[0];
    window.saveQuery = fmt[1];
    for (var l = 0; l < fmt[0].length; l += linelen) {
		str += writePadInt(nrTar, numbPos) + fmt[0].substr(l, linelen) + '\n';
		str += writePadSpace(numbPos) + fmt[2].substr(l, linelen) + '\n';
		str += writePadInt(nrQuery, numbPos) + fmt[1].substr(l, linelen) + '\n\n';

		var tarFracSeq = fmt[0].substr(l, linelen);
		tarFracSeq = tarFracSeq.replace(/-/g, '');
		nrTar += tarFracSeq.length;

		var tarFracQuery = fmt[1].substr(l, linelen);
		tarFracQuery = tarFracQuery.replace(/-/g, '');
		if (window.queryIsReverse == true) {
		    nrQuery -= tarFracQuery.length;
		} else{
		    nrQuery += tarFracQuery.length;
		}
	}

	document.getElementById('out').innerHTML = str;

	var elapse = (new Date().getTime() - time_start) / 1000.0;
	document.getElementById('runtime').innerHTML = "Run in " + elapse.toFixed(3) + "s";
}

function showExample() {
    var querySeq = "TTCTTTCATGGGGAAGCAGATTTGGGTACCACCCAAGTATTGACTCACCCATCAACAACC" +
    "GCTATGTATTTCGTACATTACTGCCAGCCACCATGAATATTGTACGGTACCATAAATACT" +
    "TGACCACCTGTAGTACATAAAAACCCAATCCACATCAAAACCCCCTCCCCATGCTTACAA" +
    "GCAAGTACAGCAATCAACCCTCAACTATCACACATCAACTGCAACTCCAAAGCCACCCCT" +
    "CACCCACTAGGATACCAACAAACCTACCCACCCTTAACAGTACATAGTACATAAAGCCAT" +
    "TTACCGTACATAGCACATTACAGTCAAATCCCTTCTCGTCCCCATGGATGACCCCCCTCA" +
    "GATAGGGGTCCCTTGACCACCATCCTCCGTGAAATCAATATCCCGCACAAGAGTGCTACT" +
    "CTCCTCGCTCCGGGCCCATAACACTTGGGGGTAGCTAAAGTGAACTGTATCCGACATCTG" +
    "GTTCCTACTTCAGGGTCATAAAGCCTAAATAGCCCACACGTTCCCCTTAAATAAGACATC" +
    "ACGATGGATCACAGGTCTATCACCCTATTAACCACTCACGGGAGCTCTCCATGCATTTGG" +
    "TATTTTCGTCTGGGGGGTATGCACGCGATAGCATTGCGAGACGCTGGAGCCGGAGCACCC" +
    "TATGTCGCAGTATCTGTCTTTGATTCCTGCCTCATCCTATTATTTATCGCACCTACGTTC" +
    "AATATTACAGGCGAACATACTTACTAAAGTGTGTTAATTAATTAATGCTTGTAGGACATA" +
    "ATAATAACAATTGAATGTCTGCACAGCCACTTTCCACACAGACATCATAACAAAAAATTT" +
    "CCACCAAACCCCCCCTCCCCCGCTTCTGGCCACAGCACTTAAACACATCTCTGCCAAACC" +
    "CCAAAAACAAAGAACCCTAACACCAGCCTAACCAGATTTCAAATTTTATCTTTTGGCGGT" +
    "ATGCACTTTTAACAGTCACCCCCCAACTAACACATTATTTTCCCCTCCCACTCCCATACT" +
    "ACTAATCTCATCAATACAACCCCCGCCCATCCTACCCAGCACACACACACCGCTGCTAAC" +
    "CCCATACCCCGAACCAACCAAACCCCAAAGACACCCCCCACA"

    var refSeq = "GTTTATGTAGCTTATTCTATCCAAAGCAATGCACTGAAAATGTCTCGACGGGCCCACACG" +
    "CCCCATAAACAAATAGGTTTGGTCCTAGCCTTTCTATTAGCTCTTAGTGAGGTTACACAT" +
    "GCAAGCATCCCCGCCCCAGTGAGTCGCCCTCCAAGTCACTCTGACTAAGAGGAGCAAGCA" +
    "TCAAGCACGCAACAGCGCAGCTCAAGACGCTCAGCCTAGCCACACCCCCACGGGAGACAG" +
    "CAGTGATAAGTCTTTAGCAATAAACGAAAGTTCAACTAAGCTACACTAACCCCAGGGTTG" +
    "GTCAACTTCGTGCCAGCCACCGCGGTCACACGATTAGCCCAAGTTAATAGAGATCGGCGT" +
    "AGAGAGTGTTTTAGATTCTTTTTCTCCCCAATAAAGCTAAAATTTACCTGAGTTGTAGAA" +
    "AACTTAAGCTAATACAAAATAAACTACGAAAGTGGCTTTAATATATCTGAACACACAATA" +
    "GCTAAGGCCCAAACTGGGATTAGATACCCCACTATGCTTAGCCCTAAACTTTAACAGTTA" +
    "AATCAACAAAACTGCTCGCCAGAACACTACGAGCCACAGCTTAAAACTCAAAGGACCTGG" +
    "CGGTGCTTCATATCCCTCTAGAGGAGCCTGTTCTGTAATCGATAAACCCCGATCAACCTC" +
    "ACCACCCCTTGCTCAGCCTATATACCGCCATCTTCAGCAAACCCTGATGAAGGCCACGAA" +
    "GTAAGCGCAAGCATCCACATAAAGACGTTAGGTCAAGGTGTAGCCCATGGAGTGGCAAGA" +
    "AATGGGCTACATTTTCTACTTCAGAAAACTACGATAGCCCTCATGAAACCTGAGGGTCGA" +
    "AGGTGGATTTAGCAGTAAACTAAGAGTAGAGTGCTTAGTTGAACAGGGCCCTGAAGCGCG" +
    "TACACACCGCCCGTCACCCTCTTCAAGTATATTTCAGGGACTACCTAACTAAAACCCCCA" +
    "CGCATCTATATAGAGGAGGCAAGTCGTAACATGGTAAGCGTACTGGAAAGTGCGCTTGGA" +
    "CGAACCAGAGGGTAGCTTAACACAAAGCACCCGGCTTACACCTGGGAGATTTCAATTCAA" +
    "CCTGGCCCCTCTGAGCTAACCCTAGCCCCAAACCCAACCCACCCTACTACCAACCAACCC" +
    "TAACCAAACCATTCACCCAAACAAAGTATAGGCGATAGAAATTACAATCCGGCGCAATAG" +
    "ACACAGTACCGTAAGGGAAAGATGAAAAAACACAACCAAGCACAACATAGCAAGGACTAA" +
    "CCCCTGTACCTTTTGCATAATGAATTAACTAGAAACAACTTTGCAAGGAGAGCCAAAGCC" +
    "AAGACCCCCGAAACCAGACGAGCTACCCATAAACAGCTAAAAGAGCACACCCGTCTATGT" +
    "AGCAAAATAGTGGGAAGATTTATGGGTAGAGGCGACAAACCTACCGAGCCTGGTGATAGC" +
    "TGGTTGTCCAAGACAGAATCTTAGTTCAACTTTAAATTTACTTACAGAACCCCTAATCCC" +
    "CTCGTAAATTTAATTGCTAGTCTAAAGAGGAACAGCTCTTTAGACACTAGGAAAAAACCT" +
    "TAAAAAGAGAGTAAAAAACACAACACCCATAGTGGGCCCAAAAGCAGCCATCAATTAAGA" +
    "AAGCGTTCAAGCTCGACACCTAAACACCAAAAAATACCAAACACAAAACTGAACTCCTTA" +
    "CTCCCCATTGGACTAATCTATTGCCCCATAGAAGAAACAATGTTAGTATAAGTAACATGA" +
    "AGATATTCTCCCCCGCATAAGTCTACGTCAGACCGAAACATCACACTGACAATTAACGGT" +
    "CCAATATGCATAGTTAACAAATAAACTATTATTTTTTCCCCCCGTTAATCCAACACAGGC" +
    "ATGCCTATAAGGAAAGGTTAAAAAAAGTAAAAGGAACTCGGCAAATCTCACCCCGCCTGT" +
    "TTACCAAAAACATCACCTCTAGCATTACCAGTATTAGAGGCACCGCCTGCCCGGTGACAT" +
    "ACGTTTAACGGCCGCGGTACCCTGACCGTGCAAAGGTAGCATAATCACTTGTTCCTTAAA" +
    "TGGGGACTTGTATGAATGGCTTCACGAGGGTTCGACTGTCTCTTACTTTTAACCAGTGAA" +
    "ATTGACCTGCCCGTGAAGAGGCGGGCATAACATAACAAGACGAGAAGACCCTATGGAGCT" +
    "TCAATTTACCAGTGCAAATAACATACAACAAGCCCACAGGCCCTAAATCACCAAACCTGC" +
    "ACTGAAGATTTCGGTTGGGGCGACCTCGGAGCACAACCCAACCTCCGAGAAACACATGTT" +
    "AAGACCTCACAAGTCAAAACGAACTTCCACACACAATTGATCCAACAACTTGACCAACGG" +
    "AACAAGTTACCCTAGGGATAACAGCGCAATCCTGTTCTAGAGTCCATATCAACAACAGGG" +
    "TTTACGACCTCGATGTTGGATCAGGACATCCTAATGGTGCAGCCGCTATTAAAGGTTCGT" +
    "TTGTTCAACGATTAAAGTCCTACGTGATCTGAGTTCAGACCGGAGCAATCCAGGTCGGTT" +
    "TCTATCTATTTCACATTTCTCCCTGTACGAAAGGACAAGAGAAATGGGGCCTACTTCACA" +
    "TAAGCGCCTTTCCCAAACAAATGATATCATCTCAATTTAACACCACACCAACACCCACCC" +
    "AAGAAAAGGGCTATGTTAAGATGGCAGAGCCCGGTAACTGCATAAAATTTAAAGCTTTAC" +
    "AGTCAGAGGTTCAACTCCTCTTCTTAACAATATGCCCATAATCAACCTCCTACTCCTCAT" +
    "TATATCCATCCTAATCGCCATAGCATTTCTAATGCTAACCGAACGAAAAATCCTAGGCCA" +
    "CACACAACTACGCAAAGGGCCCAACATTGTGGGCCCCTACGGCTTACTACAACCCTTTGC" +
    "CGACGCCCTAAAACTATTCACCAAAGAACCCCTAAAACCCTCCACATCAACCATCACCCT" +
    "TTACATTATTTCCCCCGCCCTAGCCCTTACCATTGCCCTCCTACTATGAACCCCCCTCCC" +
    "TATGCCCATCCCCCTAATCAACCTCAACTTAGGCCTCCTATTTATCCTAGCCGCGTCAAG" +
    "CCTAACCGTCTACTCCATCCTCTGATCAGGATGAGCATCTAACTCAAACTACGCCCTAAT" +
    "CGGCGCATTGCGGGCGGTAGCCCAAACGATCTCATACGAAATTACCCTAGCCCTTATCCT" +
    "GTTATCAGTACTACTAATAAGCGGCTCTTTTAACCTCTCCGCCCTCATCACAACACAAGA" +
    "ACACTCATGACTACTTCTACCATCATGACCTCTAGCCCTAATATGATTTATTTCAACACT" +
    "AGCAGAAACCAACCGAGCCCCCTTCGACCTCACCGAAGGAGAATCCGAACTAGTTTCGGG" +
    "CTTTAACACTGAATACGCCGCAGGTCCATTCGCCCTATTCTTCATAGCCGAATATACAAA" +
    "CATTATCTTAATAAACGCCCTCACCACTATAATTTTCCTAGGAACAACATTCAACATCCA" +
    "CTCCCCAGAACTCTACACAACCCTCTTCACCATCAAAACCCTACTCCTAACCTCCCTATT" +
    "CCTATGAATTCGATCAACATACCCCCGATTCCGCTACGACCAACTCATGCACCTTCTATG" +
    "AAAAAATTTCCTGCCACTCACCCTAGCACTACTAATATGACACATCTCCGTACCCATTGC" +
    "AACCTCCGGCATTCCCCCACAAACCTAAGAAATATGTCTGACAAAAGAGTTACTTTGATA" +
    "GAGTAAAAAATAGAGGTCTAAATCCCCTTATTTCTAGGATTATGGGAGTTGAACCCACCC" +
    "CTGAGAATCCAAAATTCTCCGTGCCACCCATCACACCCTATCCTAAAGTAAGGTCAGCTA" +
    "AATAAGCTATCGGGCCCATACCCCGAAAATGTTGGTTATACCCTTCCCGTACTAATTAAC" +
    "CCCTTGGCCCAACCCATCATTTACCCCACCATCTTCACAGGCACGCTCATTACAGCACTG" +
    "AGCTCCCACTGATTCTTTGCCTGACTGGGACTAGAAATAAATATACTCGCTTTCATCCCA" +
    "GTCCTAACCAAAAAAACAAGCCCCCGCTCCACAGAAGCCGCCATTAAATATTTCCTCACA" +
    "CAGGCAACCGCATCCATAATCCTCCTGATAGCCATCCTCTACAACAACATACTTTCCGGA" +
    "CAGTGAACCACAACCAACACCACCAACCCATATTCATCTCTAATAATCGTAACCGCCCTA" +
    "GCAATGAAGCTAGGAATAGCCCCCTTCCACTTTTGAGTCCCAGAAGTCACCCAAGGAGTC" +
    "CCCCTGACATCCGGCTTACTCCTCCTTACATGACAAAAATTAGCCCCCATTTCAATTATA" +
    "TACCAAATATCTTCATCGGTAGACACAAACATCCTCCTCACCCTCTCAATTCTATCTATC" +
    "CTAGTAGGCGGCTGAGGCGGACTAAACCAAACCCAACTACGCAAAATCCTGGCATACTCC" +
    "TCAATCACCCATATAGGATGAATAATAGCAGTACTACCATATAACCCAGACATCACTATC" +
    "CTCAACCTAATCATCTACATCATCCTGACAACTACCGCATTCCTAATCCTCGACTTAAAC" +
    "TCTAGTGTCACAATCCTAATATTAACCCGCACCTGGAACAAGCTGACATGACTAATACCC" +
    "TTAATCCCATCAACCTTATTATCCCTAGGGGGCCTGCCACCACTAACCGGCTTCCTGCCC" +
    "AAATGAGCCATCATTGAAGAATTTGCAAAAAATGGCAATCTCATTACCCCCACAATCATG" +
    "GCTATTATCACCCTCCTCAACCTCTACTTCTACGTACGCCTAATCTACGCCACCTCAATC" +
    "ACACTACTCCCCATATCTAACAACGCAAAAATGAAATGACAGTTCGAAAACACAAAACCC" +
    "ACCCCTCTTCTCCCCACACTCACCATTCTTACCACCCTACTCCTACCTATCTCCCCTCTC" +
    "ATCCTATCTATCTCATAGAAATTTAGGTTAACACAGACCAAGAGCCTTCAAAGCCCTCAG" +
    "CAAGTCACAGCACTTAATTTCTGTAACACTAAGGACTGCAAAGCCCCGCTCTGCATCAAC" +
    "TGAACGCAAACCAGCCACTTTAATTAAGCTAAGCCCTCCCTAGACCGATGGGACTTAAAC" +
    "CCACAAACATTTAGTTAACAGCTAAACACCCTAATCAATTGGCTTCAGTCCACTTCTCCC" +
    "GCCGCGGGGAAAAAGGCGGGAGAAGCCCCGGCAGGCCTTAAAGCTGCTCCTTCGAATTTG" +
    "CAATTCAACATGACAATCACCTCGGGGCTGGTAAAAAGAGGTCTAACCCCTGTTCTTAGA" +
    "TTTACAGCCTAATGCCTTAACTCGGCCATTTTACCCCCCCCCCCCCTTTTTTTCTCCACT" +
    "AATGTTCGCCGACCGCTGGCTATTCTCCACGAACCACAAAGACATCGGGACACTATACCT" +
    "GTTATTCGGCGCATGGGCTGGAGTCCTAGGCACTGCCCTAAGCCTCCTCATTCGAGCTGA" +
    "ACTGGGCCAACCCGGCAACCTTCTAGGCAATGACCATATCTACAATGTCATCGTCACAGC" +
    "TCATGCATTCGTAATAATTTTCTTTATAGTCATACCCATTATAATTGGAGGCTTTGGCAA" +
    "CTGACTAGTGCCCCTAATAATCGGCGCCCCCGATATAGCATTCCCGCGCATAAATAATAT" +
    "AAGCTTCTGACTCCTCCCCCCCTCCTTTCTCCTACTGCTCGCTTCTGCTACAGTAGAGGC" +
    "TGGCGCAGGAACAGGCTGAACAGTCTATCCGCCCCTAGCAGGAAACTACTCTCACCCAGG" +
    "AGCCTCTGTAGACTTAACAATCTTCTCTTTACACCTAGCAGGCATTTCCTCTATCCTAGG" +
    "AGCTATCAATTTCATCACAACAATTATTAATATAAAACCCCCTGCAATATCCCAATACCA" +
    "AACCCCCCTCTTCGTCTGATCAGTCTTGATCACAGCAGTCCTACTTCTCCTTTCCCTCCC" +
    "AGTCCTAGCCGCTGGCATCACCATACTACTAACAGATCGCAACCTAAACACCACATTCTT" +
    "TGACCCAGCCGGAGGTGGAGATCCCATCCTATATCAGCACCTATTCTGATTTTTTGGCCA" +
    "CCCTGAAGTCTACATTCTCATCCTGCCGGGTTTCGGCATAATCTCCCACATCGTAACACA" +
    "CTATTCCGGAAAAGAAGAGCCATTTGGGTACATAGGCATAGTCTGAGCCATAGTCTCAAT" +
    "TGGCTTCCTGGGCTTTATCGTATGGGCCCACCACATATTCACAGTAGGAATAGACGTGGA" +
    "CACACGAGCCTACTTCACCTCCGCTACCATAATCATTGCCATCCCCACCGGCGTCAAAGT" +
    "ATTTAGCTGACTCGCTACACTCCACGGAAGCAACACTAAATGATCTGCCGCAATCCTCTG" +
    "AGCCTTAGGATTCATTTTCCTCTTCACCGTAGGCGGCCTAACAGGCATCGTACTAGCAAA" +
    "CTCATCACTAGACATTGTATTACACGATACATACTACGTTGTAGCCCACTTTCATTACGT" +
    "CCTATCAATAGGAGCTGTATTCGCCATCATGGGAGGCTTCATCCACTGGTTCCCACTATT" +
    "CTCAGGCTACACCTTAGACCAGACCTATGCTAAAATTCACTTCATCACCATATTTATCGG" +
    "CGTAAATTTAACTTTCTTCCCACAACATTTCCTCGGCCTGTCAGGCATACCCCGACGCTA" +
    "CTCCGACTACCCCGACGCGTACACCACCTGAAATATTTTATCATCCGCAGGCTCATTTAT" +
    "CTCCCTAACAGCAGTCATACTAATAATTTTCATAATTTGAGAAGCCTTCGCCTCAAAACG" +
    "AAAAGTCCCAATAGTTGAACAACCCTCCACAAGCCTAGAGTGATTGTACGGATGCCCCCC" +
    "ACCCTACCACACATTTGAAGAACCCGTCTATATAAAACCAGAACAAAAAAGGAAGGAATC" +
    "GAACCTCCTAAAGCTGGTTTCAAGCCAACCCCACAACCTCCATGACTTTTTCAAGAGATA" +
    "CTAGAAAAACCATTTCATGACTTTGTCAAAGTTAAGTTACAGGCCAAACCCTGTGTATCT" +
    "TAATGGCGCACGCAGCACAGGTAGGTTTACAAGACGCTACCTCTCCTATCATAGAAGAAT" +
    "TGGTCATCTTTCACGACCACGCCCTCATAATCATTTTCCTAATCTGCTTCCTAGTCCTGT" +
    "ACGCCCTATTCCTAACACTCACAACAAAACTCACCAACACCAGCATCTCAGACGCCCAAG" +
    "AGATAGAGACTATTTGAACTATCCTACCGGCCATCATCCTAATTCTAATCGCCCTCCCAT" +
    "CCCTACGCATCCTCTACTTAACAGACGAGATCAACGACCCTTCCTTCACCATCAAATCAA" +
    "TCGGTCATCAATGATACTGAACCTACGAGTACACTGACTACGGTGGATTGATCTTCAACT" +
    "CTTACATGCTCCCACCACTATTCCTAGAACCAGGCGACCTTCGACTCCTCGACGTCGACA" +
    "ACCGAGTAGTCCTCCCAGTCGAAGCTCCCGTTCGCATAATAATCACATCCCAAGACGTCT" +
    "TACACTCATGAACTGTACCCTCACTAGGCCTGAAAACGGACGCAATCCCCGGACGCCTAA" +
    "ACCAAACCACATTCACTGCCACGCGACCAGGAGTGTACTATGGCCAATGCTCAGAAATCT" +
    "GTGGAGCTAACCACAGCTTTATGCCTATCGTCCTAGAACTAATCCCCCTAAAAATCTTCG" +
    "AAATAGGGCCCGTATTCACTTTATAACTTCCCCCACCCCCACAACCCATCCTACCCCCTT" +
    "TCCTGAGGCCCACTGCAAAGCTAATCTAGCATTAACCTTTTAAGTTAAAGACTAAGAGAA" +
    "TCAACCCCTCTTTGCAGTGAAATGCCCCAACTAAATACCACCACATGGCCCACCATCATC" +
    "ACCCCAATACTCCTTGCACTATTCCTCATCACTCAACTAAAACTACTAAACTCACACCTC" +
    "CACCCACCCACCCCACCAAAATTCACTAAACCAAAACTCCACGCCAAACCCTGAGGACCA" +
    "AAATGAACGAAAGTCTATTTACCCCATTCATTACCCCCACAGTACTAGGCCTCCCCGCCG" +
    "CAGTACTAGTCATCTTATTTCCCCCCTTACTGATCCCCACCTCCAAACATCTCATCAACA" +
    "ACCGACTAATTATTATCCAACAATGACTAATCCGACTCATCCTAAAACAAATAATAACCA" +
    "CCCATAACGCTAAAGGACGAACTTGATCCCTCATACTAACGTCCCTAATCATTTTCATCG" +
    "CCTCAACCAACCTCCTAGGACTCCTCCCCTACTCATTTACACCAACCACCCAACTATCCA" +
    "TAAATTTAGCTATAGCAATTCCCTTATGAGCAAGCACGGTAGCTATGGGCCTTCGCTTCA" +
    "AAGCCAAAATTACCCTAACCCACCTCTTACCACAAGGTACCCCCACACCTCTCATCCCTA" +
    "TACTAATTATTATTGAAACCGTCAGCCTTTTCATTCAACCACTAGCCTTAGCCGTACGCC" +
    "TAACTGCTAACATCACTGCAGGCCACCTACTCATGCACCTAATCGGAAGCTCTGCACTAG" +
    "CTATACTAGCCATCAACCTCCCCCTAACCCTCATCACCCTTACAATCTTAACCCTGCTAA" +
    "CAATCCTGGAGACTGCCATCGCCCTAATTCAAGCCTACGTCTTCACACTTCTAGTAAGCC" +
    "TCTACCTGCACGACAACTCATAATGGCCCATCAATCACACGCCTACCACATAGTAAAACC" +
    "TAGCCCATGACCCCTAACAGGAGCTCTCTCAGCCCTCCTAACAACATCTGGCCTAACCAT" +
    "GTGATTCCACTTCCACTCCACAACCCTACTATTAACAGGCCTACTAACCAATGCACTAAC" +
    "CATATACCAATGGTGACGAGATGTAGTGCGAGAAAGCACATACCAAGGCCACCACACACT" +
    "ACCCGTCCAAAAAGGCCTCCGATATGGAATAATCCTATTCATCACTTCAGAAGTCTTTTT" +
    "CTTCGCCGGATTCTTCTGAGCATTCTACCACTCCAGCCTAGCCCCCACCCCTCAACTTGG" +
    "AGGACACTGACCCCCAACAGGCATTATCCCCCTCAACCCCCTAGAAGTCCCACTCCTAAA" +
    "CACATCCGTACTACTCGCATCAGGAGTCTCAATTACCTGAGCCCATCACAGCCTGATGGA" +
    "AAATAATCGAACCCAAATAATTCAAGCACTACTCATCACAATCTTACTAGGCATCTACTT" +
    "CACTCTCCTTCAGGCTTCAGAATACATTGAAGCTCCTTTCACCATCTCTGACGGCATCTA" +
    "CGGCTCAACATTCTTCATAGCCACGGGATTCCACGGCCTCCACGTCATTATCGGATCAAC" +
    "TTTCCTCACTGTATGCCTAGCCCGCCAGCTATTATTCCACTTCACATCCAAACATCACTT" +
    "TGGCTTTGAGGCCGCCGCCTGATACTGGCACTTTGTAGACGTAGTCTGACTGTTTCTGTA" +
    "CGTCTCCATCTACTGATGAGGTTCCTACTCTTTTAGTATAAACAGTACCGTTAACTTCCA" +
    "ATTAACTAGTTTTGACAACGCCCAAAAAAGAGTAATTAACTTCGTCCTAGCTCTAACAGT" +
    "CAACACCCTCCTAGCCCTGCTACTAATAACCATCACATTCTGACTACCACAACTCTACCC" +
    "CTACATAGAAAAATCCGACCCATACGAATGTGGATTTGACCCCGCATACCCCGCTCGCAT" +
    "TCCTTTCTCCATAAAATTTTTCTTAGTAGCCATCACCTTCCTACTATTCGACCTAGAAAT" +
    "CGCCCTGCTACTACCCCTGCCATGGGCCCTACAAACAACCAACTTACCACTAATAACTAC" +
    "ATCATCACTTATATTAATTATCATCCTAGCCCTAGGCCTAACTTACGAATGATCACAAAA" +
    "AGGATTAGACTGAGCCGAATTGGTAAATAGTTTAAACAAAACAAATGATTTCGACTCATT" +
    "AAATTATGACAGCCATATTTACCAAATGCCCCTTATCTACATAAATATCACACTAGCATT" +
    "CACCATATCACTCCTAGGCATACTAGTCTACCGCTCACACCTAATATCTTCTCTACTATG" +
    "TCTAGAAGGAATAATATTATCATTGTTCATTATAATTACTCTCATAACCCTCAACACCCA" +
    "CTCTCTCCTAGCTAACATCATACCCATCACCATGCTAGTCTTCGCTGCCTGCGAAGCAGC" +
    "AGTAGGCCTCGCCCTACTAGCCTCAATCTCCAATACATACGGCCTAGACTACGTCAACAA" +
    "CCTAAACCTACTTCAATGCTAAAACTAATTATCCCAACAATCATACTGCTGCCCCTAACA" +
    "TGACTCTCCAAAACGCACATAATCTGAATCAACACCACCACCCACAGCCTAATCATCAGC" +
    "TCCATCCCCCTACTATTCCTCAATCAAACCAACAGCAACCTGTACAGCTACTCCCTTCTT" +
    "TTCTCCTCCGACCCCTTATCAACCCCCCTTCTAATACTAACAACCTGACTCCTACCCCTC" +
    "ATAATTATAGCAAGCCAACACCATCTATCCAACGAACCCCCATCACGAAAAAAATTATAC" +
    "CTCACCATACTAATCTCTCTTCAAATCTCCCTAATCATAACATTCACAGCCACAGAGCTA" +
    "ATTATATTTTATATCCTCTTCGAAACCACTCTCATCCCCACCCTAGTCATTATCACCCGC" +
    "TGAGGCAACCAGCCAGAGCGCTTAAATGCAGGCACATACTTTCTATTCTACACACTAGTA" +
    "GGCTCCCTCCCCCTACTCATTGCCCTAATCCACACCTACAACACCCTAGGCTCGCTTAAC" +
    "ATTGTATTACTAACTCTCACCGCCCGGGAGCTAACAGACTCCTGATCCAACAGCCTAATA" +
    "TGACTAGCGTACACAATAGCTTTCATAGTAAAAATACCCCTCTACGGACTACACCTATGA" +
    "CTCCCTAAAGCCCATGTAGAAGCCCCCATTGCCGGCTCAATAGTACTCGCCGCAGTGCTC" +
    "TTAAAACTAGGTGGTTACGGTATAATACGCCTTATCCCCATTCTCAATCCCCTAACTAAA" +
    "CACATAGCCTACCCCTTTATCATACTATCCCTATGAGGCATAATCATAACAAGCTCCATC" +
    "TGCTTACGACAAACCGACCTAAAATCACTCATCGCATACTCCTCAGTCAGCCACATAGCG" +
    "CTTGTTGTAGCAGCTATCCTCATTCAAACCCCCTGAAGCTTCACCGGCGCAACCACCCTC" +
    "ATAATTGCCCATGGACTCACATCCTCCCTACTGTTCTGCCTAGCAAACTCAAACTACGAA" +
    "CGAACCCACAGCCGCATCATAATCCTCTCTCAAGGCCTTCAAACTCTACTCCCCCTAATA" +
    "GCCCTCTGATGACTTCTAGCAAGCCTCACTAACCTTGCCCTACCACCCACCATCAACCTA" +
    "CTAGGAGAACTCTCCGTACTAATAGCCATATTCTCTTGATCTAACATCACCATCCTACTA" +
    "ACAGGACTCAACATACTAATCACAACCCTATACTCTCTCTATATATTCACCACAACACAA" +
    "CGAGGTACACCCACACATCACACCAACAACATAAAACCTTCTTTCACACGTGAAAACACC" +
    "CTCATGCTCATACACCTATCCCCCATTCTCCTCTTGTCCCTCAACCCCAGCATCATCGCT" +
    "GGATTCGCCTACTGTAAATATAGTTTAACCAAAACATCAGATTGTGAATCTAATAATAGG" +
    "GCCCACAACCCCTTATTTACCGAGAAAGCTCACAAGAACTGCTAACTCTCACCCCATGTG" +
    "TAACAACATGGCTTTCTCAACTTTTAAAGGATAACAGCTATCCCTTGGTCTTAGGACCCA" +
    "AAAATTTTGGTGCAACTCCAAATAAAAGTAACAGCCATGTTTACCACCATAACTGCCCTC" +
    "ACCTTGACTTCCCTAATCCCCCCCATTACCGCTACCCTCATTAACCCCAACAAAAAAAAC" +
    "TCATACCCCCACTATGTAAAAACTGCCATCGCATCCGCCTTTACTATCAGCCTTATCCCA" +
    "ACAACAATATTTATCTGCCTAGGACAAGAAACCATCGTCACAAACTGATGCTGAACAACC" +
    "ACCCAGACACTACAACTCTCACTAAGCTTCAAACTTGACTACTTCTCCATAACATTCCTC" +
    "CCCGTAGCACTACTCATCACTTGATCCATTATAGAATTTTCACTATGGTATATAGCCTCA" +
    "GACCCAAACATCAACCAATTTCTCAAATTCCTCCTTATTTTCCTAATCACCATAATTATC" +
    "CTAGTCACTGCCAATAACCTACTCCAACTCTTCATCGGCTGAGAGGGCGTAGGGATCATA" +
    "TCCTTCCTGCTCATTAGTTGATGATACGCCCGAACAGACGCCAACACGGCAGCTATTCAA" +
    "GCAATCCTATACAATCGTATCGGCGATATTGGCTTCATCCTGGCTCTAGCATGATTCCTC" +
    "CTACACTCCAACTCATGGGAACTACAACAAGTATTCCTCCTAAACAATAACCCTAACCTC" +
    "CTCCCACTACTAGGACTCCTCCTAGCCGCAGCTGGCAAATCAGCCCAACTAGGCCTTCAC" +
    "CCCTGACTACCCTCAGCCATAGAAGGCCCAACCCCCGTCTCAGCCCTACTTCACTCAAGC" +
    "ACCATGGTCGTGGCTGGGGTCTTCCTACTCATCCGCTTTCACCCATTAACAGAAAACAGC" +
    "CCACATATCCAAACCCTTACACTATGCTTAGGGGCCATCACCACCCTGTTCGCAGCAATC" +
    "TGCGCCCTCACACAAAACGACATTAAGAAAATCGTAGCTTTCTCCACCTCAAGTCAACTA" +
    "GGACTTATAATGGTCACAATTGGCATTAACCAGCCACACCTGGCACTCCTCCACATCTGC" +
    "ACCCACGCCTTCTTCAAAGCCCTTTTATTCATATGTTCTGGGTCCATCATCCACAACCTC" +
    "AACAATGAGCAAGACATCCGAAAAATAGGAGGACTACTCAAAACCATACCCCTAACCTCA" +
    "ACCTCCCTCACTATCAGCAGCCTAGCCCTCGCAGGAATACCCTTCCTCTCAGGCTTCTAC" +
    "TCCAAAGACCTCATTATCGAGACCGCAAACATATCCTATACCAACACCTGAGCCCTGTCT" +
    "ATCACTCTCATCGCCACCTCCTTAACAGGCGCCTACAGCACTCGAATAATCCTCCACACC" +
    "CTTACAAGCAAACCCCACTTCCCAACCCCAATCTCTATCAATGAAAACAACCCCACTCTA" +
    "CTTAAACCCATCAAGCGCCTTATGCTAGGAAGCCTATTCGCAGGATTCCTAATCACCAAC" +
    "AACATCCCCCCTATATCCCTGCCCCAAGTAACAACCCCCCCTTACCTAAAACTCGCAGCT" +
    "CTAGCTGCCACCCTCCTAGGTCTCCTAGTAGCCCTAGACTTAAACTACCTAGCCAACAAA" +
    "CTCAAGACAAAAACCCCTCCACCCACATTCTATTTCTCCATCATACTCGGATTCTACCCT" +
    "AGCATCATCCACCGCATAATCCCCCACCTAAGCCTTCTCATAAGCCAAAACTTATCCCTA" +
    "CTCCTACTAGACCTAACCTGACTAAAAAAACTAATACCCAAAACAATCTCACAACACCAA" +
    "ACCTCAGCCTCCATCACTATTTCAACCCAAAAAGGTTTAATCAAACTCTACTTCCTCTCT" +
    "TTCCTCATCCCACTCCTCCTAATCCTCCTTATAATCTCATAACCTATTACCCCGAGCAAT" +
    "CTCAATTACAACATAAACACCAACAAATAACGTTCAACCAGTAACCACCACCAACCAACG" +
    "CCCATAATCATATAAAGCCCCCGCACCAATAGGATCCTCCCGAATCAACCCCGACCCTTC" +
    "CCCTTCATAAATTATCCAGCTCCCCACGCTATTAAAATTCACCACTACCACCACTCCATC" +
    "ATACTCTTTTACCCACAACACCAGCCCCACTTCCATCACTAATCCCACCAGAACACTCAC" +
    "CAATACCTCAACCCCTGACCCCCATGCCTCAGGATATTCCTCAATAGCTATTGCCGTAGT" +
    "ATACCCAAAAACAACCATCATACCCCCTAAATAAATTAAAAAAACCATTAAACCCATATA" +
    "ACCTCCCCCACAATTTAAAATAACTGCACACCCAACCGCACCACTAATAATCAACACTAA" +
    "ACCCCCATAAATAGGAGAGGGCTTAGAAGAAAACCCCACGAACCCTATCACTAAAATTAC" +
    "ACTCAACAGAAACAAAGCATATGTCATTGTTCTCGCATAGACTGTGACTATGACCAATGG" +
    "TATGAAAAAACATCGTTGTACCTCAACTACAAGAACACTAATGACCTCAACACGTAAAAC" +
    "CAACCCACTAATAAAATTAATCAACCACTCACTTATCGACCTCCCCACCCCATCAAACAT" +
    "CTCCGCATGATGGAACTTCGGCTCACTCCTAGGCGCCTGCTTAATCATCCAAATCACCAC" +
    "TGGACTATTCCTAGCTATACATTATTCACCAGACGCCTCCACTGCCTTTTCATCAATCGC" +
    "CCACATCACTCGAGATGTAAACTACGGCTGAATAATTCGCCACCTCCACGCTAACGGCGC" +
    "CTCAATATTCTTTATCTGCCTCTTCTTACATATCGGCCGAGGCCTATACTATGGCTCATT" +
    "CACCCACCTAGAAACCTGAAACATCGGCATCATCCTACTATTTACAACTATAATAACAGC" +
    "CTTCATAGGTTACGTCCTCCCATGAGGCCAAATATCCTTCTGAGGAGCCACAGTAATCAC" +
    "AAATCTACTGTCCGCCATCCCATACATTGGAACAGACCTGGTCCAATGAGTCTGAGGTGG" +
    "CTACTCAGTAAATAGCCCCACTCTAACACGATTCTTCACCCTACACTTCATACTACCCTT" +
    "CATTATTACAGCCCTAACAACTCTACACCTCTTATTCCTACACGAAACAGGATCAAATAA" +
    "CCCCCTGGGAATCCCCTCCCATTCCGACAAAATCACCTTCCACCCCTACTACACAATCAA" +
    "AGACATCCTAGGCCTACTCCTTTTTCTCCTCGCCCTAATAACACTAACACTACTCTCACC" +
    "AGACCTCCTAAGCGACCCAGACAACTACACCTTAGCTAACCCCCTAAGCACCCCACCCCA" +
    "CATTAAACCCGAATGATATTTCCTATTCGCCTACGCAATCCTACGATCCGTCCCCAACAA" +
    "ACTAGGAGGTGTAATAGCCCTCATACTATCCATCCTAATCCTAACAACAATCCCTGCCCT" +
    "TCACATGTCCAAGCAACAGAGCATAACATTTCGCCCATTGAGCCAATTCCTATATTGACT" +
    "TTTAATCGCCGACCTTCTAATTCTCACCTGAATTGGAGGGCAACCAGTAAGCTACCCCTT" +
    "CATCACCATTAGCCAAGTAGCATCCACATTGTACTTCACTACTATCCTTCTACTTATACC" +
    "AGCCTCTTCCCTGATCGAAAACCACATACTCAAATGAACCTGCCCCTGTAGTACAAATAA" +
    "GTACACCAGCCTTGTAACCTGAAAATGAAGACCCTCTTCCATGGGCAAAAAAAATCAGAG" +
    "AAAAAGCACTTAACTTCACCGTCAGCCCCCAAAGCCAACATTCTAATTTTAAACTACTCT" +
    "CTGTTCTTTCATGGGGGACCAGATTTGGGTGCCACCCCAGTACTGACCCATTTCTAACGG" +
    "CCTATGTATTTCGTACATTCCTGCTAGCCAACATGAATATCACCCAACACAACAATCGCT" +
    "TAACCAACTATAATGCATACAAAACTCCAACCACACTCGACCTCCACACCCCGCTTACAA" +
    "GCAAGTACCCCCCCATGCCCCCCCACCCAAACACATACACCGATCTCTCCACATAACCCC" +
    "TCAACCCCCAGCATATCAACAGACCAAACAAACCTTAAAGTACATAGCACATACTATCCT" +
    "AACCGCACATAGCACATCCCGTTAAAACCCTGCTCATCCCCACGGATGCCCCCCCTCAGT" +
    "TAGTAATCCCTTACTCACCATCCTCCGTGAAATCAATATCCCGCACAAGAGTGCTACTCC" +
    "CCTCGCTCCGGGCCCATAAAACCTGGGGGTAGCTAAAGTGAGCTGTATCCGGCATCTGGT" +
    "TCTTACTTCAGGGCCATAAAACCCAAGATCGCCCACACGTTCCCCTTAAATAAGACATCA" +
    "CGATGGATCACAGGCCTATCACCCTATTAATCACTCACGGGAGCTCTCCATGCATCTGGT" +
    "ATTTTTTCGGGGGGGGATGCACGCGATAGCATCGCGGGCCGCTGGAACCGGAGCACCCTA" +
    "TGTCGCAGGATCTGTCTTTGATTCCTACCTCATGCCATTATTAATCGCGCCTAATATCCA" +
    "ATATCCTAGCCCCACCCTCAGTGTTTGAAGCTGCTATTTAATTTATGCTAGAGGACATAA" +
    "AATTACCAAAAAAAAATAAACGAACTCTCAACAACCCTACCCCATCAACCCAACAAAATC" +
    "CAATTTTTATCTTTAGGCTATGTGCACTTTCAACAGGCACCCCTCAACTAACACAATCTC" +
    "CTTCTTATCCCACCCACCAACCCCCCCCCCCCCTTCCTCCCTCTTTCTCCATTTTCCCCA" +
    "CAAACACCGCTACTACCCCCACACCCCAGACCAACCCAACCCAAAAGACACCCCGCACG"

	document.getElementById('target').value = refSeq;
	document.getElementById('query').value = querySeq;
}