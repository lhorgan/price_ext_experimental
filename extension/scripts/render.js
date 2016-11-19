var namedSets = {};
var jsonArr = [];

function generateContainer(type, flex_dir) {
    var container = '';
    container +=   '<div class="container">';
	container +=   '<div class="' + type + '">';
    container +=   '<div class="menu">';
	container +=   '<div class="arrow destroy"><i class="material-icons">close</i></div>';
	container +=   '<div class="arrow hide"><i class="material-icons">arrow_back</i></div>';
	container +=   '</div>';
	container +=   '<div class="type">' + type + '</div>';
	container +=   '</div>';
	container +=   '<div class="content ' + flex_dir + '">';
	container +=   '</div>';
    container +=   '</div>';
    
    return $(container);
}

function drawJSON(theJSON, holder) {
    jsonArr = theJSON;
    var idPrefix = randomString(20) + "_arryID_";
    
    for(var i = 0; i < jsonArr.length; i++) {
        (function() {
            var container = generateContainer("array", "flex-vertical");
            var index = i;
            container.find(".hide").removeClass("hide").addClass("addElement").html('<i class="material-icons">add</i>');
            container.attr("id", idPrefix + index);

            bindArrayEvents(container, idPrefix);

            holder.append(container);
            resolveType(jsonArr[index], container.find(".content")).draw();  
        })();
    }
}

/* NOTE: USE THIS VERSION FOR NON IFRAMES ONLY CHANGE */
function bindArrayEvents(container, idPrefix) {
    container.find(".destroy").click(function() {
        var index = parseInt(container[0].id.substr(28));
        
        if(index > 0) {
            var toChange = [];
            for(var x = index + 1; x < jsonArr.length; x++) {
                toChange.push($("#" + idPrefix + x));
            }
            for(var x = 0; x < toChange.length; x++) {
                var oldIndex = parseInt(toChange[x].attr("id").substr(28));
                toChange[x].attr("id", idPrefix + (oldIndex - 1));
            }
            jsonArr.splice(index, 1);

            container.remove();
        }
    });
    
    container.find(".addElement").click(function() {
        var index = parseInt(container[0].id.substr(28)) + 1;
        var toChange = [];
        for(var x = index; x < jsonArr.length; x++) {
            toChange.push($("#" + idPrefix + x));
        }
        for(var x = 0; x < toChange.length; x++) {
            var oldIndex = parseInt(toChange[x].attr("id").substr(28));
            toChange[x].attr("id", idPrefix + (oldIndex + 1));
        }
        
        var newContainer = generateContainer("array", "flex-vertical");
        newContainer.find(".hide").removeClass("hide").addClass("addElement").html('<i class="material-icons">add</i>');
        newContainer.attr("id", idPrefix + index);
        var sibling = $("#" + idPrefix + (index - 1));
        newContainer.insertAfter(sibling);
        
        var newElement = {};
        jsonArr.splice(index, 0, newElement);
        resolveType(newElement, newContainer.find(".content")).draw();
        
        bindArrayEvents(newContainer, idPrefix);
    });
}

function SetOp(obj, ctx, container) {
    this.obj = obj;
    this.ctx = ctx;
    this.container = container;
    this.id = randomString(20);
    
    if(typeof container == "undefined") {
        var keys = Object.keys(this.obj);
        var op = keys[0];
        this.container = generateContainer(op, "flex-vertical");
        this.ctx.append(this.container);
    }
}

function resolveType(obj, ctx, container) {
    var keys = Object.keys(obj);
    var type = keys[0];
    
    var res = null;
    
    if(keys.length == 0) {
        //alert("SWEET");
        res = new Slate(obj, ctx, container);
    }
    else if(type == "chain") {
        res = new Chain(obj, ctx, container);
    }
    else if(type == "desc") {
        res = new Desc(obj, ctx, container);
    }
    else if(type == "ref") {
        res = new Ref(obj, ctx, container);
    }
    else if(type == "super") {
        res = new UniOp(obj, ctx, container);
    }
    else if(type == "union" || type == "inter" || type == "sinter" || type == "diff") {
        res = new SetOp(obj, ctx, container);
    }
            
    if(res == null) {
        console.error("could not resolve type");
    }
    
    return res;
}

SetOp.prototype.destroy = function() {
    var keys = Object.keys(this.obj);
    var op = keys[0];
    
    for(var member in this.obj) {
        delete this.obj[member];
    }
    this.container.find(".content").empty();

    this.convertToSlate(op);
}

SetOp.prototype.convertToSlate = function(op) {
    var label = this.container.find("." + op).addClass("slate").removeClass(op);
    this.container.find(".type").text("slate");
    this.container.find("*").unbind("click");
    this.container.find(".arrow").removeClass("arrow").addClass("arrow-p");
    
    var slate = new Slate(this.obj, this.ctx, this.container);
    slate.draw();
}

SetOp.prototype.draw = function() {
    var keys = Object.keys(this.obj);
    var op = keys[0];
    
    var set1 = this.obj[op][0];
    var set2 = this.obj[op][1];
    
    var _this = this;
    this.container.find(".destroy").click(function() {
        _this.destroy(); 
    });
    
    //var container = generateContainer(op, "flex-vertical");
    //this.ctx.append(container);
    var ctx = this.container.find(".content");
    
    if(!Array.isArray(set1)) {
        resolveType(set1, ctx).draw();
    }
    if(!Array.isArray(set2)) {
        resolveType(set2, ctx).draw();
    }
}

SetOp.prototype.drawEmpty = function(setNum) {
    var types = generateSelect(["", "union", "diff", "inter", "sinter", "desc", "chain"]);
    
    types.change(function() {
    });
    
    this.container.find(".content").append("<div class='typeSelect_" + setNum + "'></div>");
    this.container.find(".typeSelect_" + setNum).append(types);
}

function Ref(obj, ctx, container) {
    this.obj = obj;
    this.ctx = ctx;
    this.container = container;
    this.id = randomString(20);
    
    if(typeof container == "undefined") {
        this.container = generateContainer("ref", "flex-horizontal");
        this.ctx.append(this.container);
    }
}

Ref.prototype.draw = function() {
    var _this = this;
    this.container.find(".destroy").click(function() {
        _this.destroy(); 
    });
    
    var holder = $("<div class='descInfo'></div>");
    var namedList = generateSelect([""].concat(Object.keys(namedSets)));
    
    namedList.change(function() {
        _this.obj.ref = $(this).val();
    });
    
    holder.append(namedList);
    namedList.val(this.obj.ref);
    //alert(this.obj.ref);
    this.container.find(".content").append(holder);
}

Ref.prototype.destroy = function() {
    for(var member in this.obj) {
        delete this.obj[member];
    }
    
    gcontainer = this.container;
    this.container.find(".content").empty();
    this.convertToSlate();
}

Ref.prototype.convertToSlate = function() {
    var label = this.container.find(".ref").removeClass("ref").addClass("slate");
    this.container.find(".type").text("slate");
    this.container.find("*").unbind("click");
    this.container.find(".arrow").removeClass("arrow").addClass("arrow-p");
    
    var slate = new Slate(this.obj, this.ctx, this.container);
    slate.draw();
}

function Desc(obj, ctx, container) {
    this.obj = obj;
    this.ctx = ctx;
    this.container = container;
    this.id = randomString(20);
    
    if(typeof container == "undefined") {
        this.container = generateContainer("desc", "flex-horizontal");
        this.ctx.append(this.container);
    }

    var options = this.obj.desc[1];
    if("name" in options) {
        namedSets[options.name] = this.obj.desc[0];
    }
}

Desc.prototype.draw = function() {
    /*let*/var _this = this;
    this.container.find(".destroy").click(function() {
        _this.destroy(); 
    });
    
    var ctx = this.container.find(".content");
    
    var descInfo = $("<div class='descInfo arrow'></div>");
    /*let*/var addName = $("<div class='.addName'>+NAME</div>");
    /*let*/var addDeep = $("<div class='.addDeep'>+DEEP</div>");
    /*let*/var addCtxt = $("<div class='.addCtxt'>+CTXT</div>");
    /*let*/var addVSID = $("<div class='.addCtxt'>+VSID</div>");
    /*let*/var addGrab = $("<div class='.addGrab'>+GRAB</div>");
    var options = this.obj.desc[1];
    
    /*let*/var nameHolder = $("<div class='nameHolder margin'><div class='nameInput'></div><div class='nametag'></div></div>");
    /*let*/var deepHolder = $("<div class='deepHolder margin'></div>");
    /*let*/var ctxtHolder = $("<div class='ctxtHolder margin'><div class='ctxtCascade'></div><div class='ctxtAct'></div></div>");
    /*let*/var vsidHolder = $("<div class='vsidHolder margin'></div>");
    /*let*/var grabHolder = $("<div class='grabHolder margin'></div>");
    
    addName.click(function() {
        if($(this).text() == "+NAME") {
            $(this).text("-NAME");
            options["name"] = "";
            _this.showNameHolder(addName, nameHolder);
            if("vsid" in options && options["vsid"] == "generate") {
                _this.showTagCheckbox(nameHolder);
            }
        }
        else {
            $(this).text("+NAME");
            nameHolder.find(".nameInput").html("");
            nameHolder.find(".nameTag").html("");
            delete namedSets[options["name"]];
            delete options["name"];
            delete options["tag"];
            
            addGrab.text("+GRAB");
            grabHolder.html("");
            delete options["grab"];
            delete options["mandatory"];
        }
    });
    addDeep.click(function() {
        if($(this).text() == "+DEEP") {
            $(this).text("-DEEP");
            options["deep"] = true;
            _this.showDeepHolder(addDeep, deepHolder);
        }
        else {
            $(this).text("+DEEP");
            deepHolder.text("");
            delete options["deep"];
        }
    });
    addCtxt.click(function() {
        if($(this).text() == "+CTXT") {
            $(this).text("-CTXT");
            options["ctxt"] = {};
            resolveType(options["ctxt"], ctxtHolder.find(".ctxtAct")).draw();
            _this.showCascadeCheckbox(ctxtHolder.find(".ctxtCascade"));
        }
        else {
            $(this).text("+CTXT");
            ctxtHolder.find(".ctxtCascade").html("");
            ctxtHolder.find(".ctxtAct").html("");
            delete options["ctxt"];
            delete options["cascade"];
        }
    });
    addVSID.click(function() {
        if($(this).text() == "+VSID") {
            options["vsid"] = "generate";
            if("name" in options) {
                _this.showTagCheckbox(nameHolder);
            }
            $(this).text("-VSID");
        }
        else {
            $(this).text("+VSID");
            nameHolder.find(".nameTag").html("");
            delete options["tag"];
            delete options["vsid"];
            
            addGrab.text("+GRAB");
            grabHolder.html("");
            delete options["grab"];
            delete options["mandatory"];
        }
    });
    addGrab.click(function() {
        if($(this).text() == "+GRAB") {
            if("name" in options && "vsid" in options) {
                options["grab"] = "";
                options["mandatory"] = false;
                $(this).text("-GRAB");
                _this.showGrabHolder(grabHolder);
            }
        }
        else {
            $(this).text("+GRAB");
            grabHolder.html("");
            delete options["grab"];
            delete options["mandatory"];
        }
    });
    
    if("name" in options) {
        this.showNameHolder(addName, nameHolder);
        if("vsid" in options && options["vsid"] == "generate") {
            this.showTagCheckbox(nameHolder);
        }
    }
    if("deep" in options) {
        this.showDeepHolder(addDeep, deepHolder);
        //addDeep.text("-DEEP");
        //deepHolder.append("<label for='deep'>Deep Search:</label><input class='deepInput' type='checkbox' value='deep' />");
    }
    if("ctxt" in options) {
        addCtxt.text("-CTXT");
        this.showCascadeCheckbox(ctxtHolder.find(".ctxtCascade"));    
        resolveType(options["ctxt"], ctxtHolder.find(".ctxtAct")).draw();
    }
    if("vsid" in options) {
        addVSID.text("-VSID");
    }
    if("grab" in options) {
        addGrab.text("-GRAB");
        this.showGrabHolder(grabHolder);
    }
    
    descInfo.append(addName);
    descInfo.append(addDeep);
    descInfo.append(addCtxt);
    descInfo.append(addVSID);
    descInfo.append(addGrab);
    this.container.find(".content:first").append(descInfo);
    this.container.find(".content:first").append(nameHolder);
    this.container.find(".content:first").append(deepHolder);
    this.container.find(".content:first").append(ctxtHolder);
    this.container.find(".content:first").append(grabHolder);
    
    var toDraw = resolveType(this.obj.desc[0], ctx);//.draw();
    
    //console.log(toDraw);
    toDraw.draw();
}

Desc.prototype.showNameHolder = function(addName, nameHolder) {
    var options = this.obj.desc[1];
    addName.text("-NAME");
    var nameInput = $("<input type='text' class='nameInput' placeholder='name' />");
    nameHolder.find(".nameInput").append(nameInput);
    nameInput.val(options.name);
    
    var _this = this;
    nameInput.focusout(function() {
        options.name = $(this).val();
        namedSets[options.name] = _this.obj.desc[0];
        for(var member in namedSets) {
            if(member != options.name && namedSets[member] == namedSets[options.name]) {
                delete namedSets[member];
            }
        }
    });
}

Desc.prototype.showDeepHolder = function(addDeep, deepHolder) {
    var options = this.obj.desc[1];
    addDeep.text("-DEEP");
    var deepInput = $("<label for='deep'>Deep Search?</label><input class='deepInput' type='checkbox' value='deep' />");
    deepHolder.append(deepInput);
    deepInput.attr("checked", options.deep);
    
    deepInput.change(function() {
        options["deep"] = $(this).prop("checked");
    });
}

Desc.prototype.showCascadeCheckbox = function(checkHolder) {
    var options = this.obj.desc[1];
    var checkbox = $("<label for='cascade'>Cascade?</label><input class='cascadeInput' type='checkbox' value='cascade' />");
    checkHolder.append(checkbox);
    checkbox.attr("checked", options.cascade);
    
    checkbox.change(function() {
        options["cascade"] = $(this).prop("checked");
    });
}

Desc.prototype.showTagCheckbox = function(nameHolder) {
    var options = this.obj.desc[1];
    var checkbox = $("<label for='tag'>Tag?</label><input class='cascadeInput' type='checkbox' value='tag' />");
    nameHolder.find(".nametag").append(checkbox);
    checkbox.attr("checked", options.tag);
    
    checkbox.change(function() {
        options["tag"] = $(this).prop("checked");
    });
}

Desc.prototype.showGrabHolder = function(grabHolder) {
    var options = this.obj.desc[1];
    var grabInput = $("<input type='text' class='grabInput' placeholder='type' />");
    var mandatoryInput = $("<label for='tag'>Mandatory?</label><input class='mandatoryInput' type='checkbox' value='tag' />");
    grabHolder.append(grabInput);
    grabHolder.append(mandatoryInput);
    grabInput.val(options.grab);
    mandatoryInput.attr("checked", options["mandatory"]);
    
    var _this = this;
    grabInput.keyup(function() {
        options.grab = $(this).val();
    });
    mandatoryInput.change(function() {
        options["mandatory"] = $(this).prop("checked");
    });
}

Desc.prototype.destroy = function() {
    for(var member in this.obj) {
        delete this.obj[member];
    }
    
    gcontainer = this.container;
    
    var nameInputs = this.container.find(".content").find(".nameInput");
    for(var i = 0; i < nameInputs.length; i++) {
        delete namedSets[$(nameInputs[i]).val()];
    }
    
    this.container.find(".content").empty();
    this.convertToSlate();
}

Desc.prototype.convertToSlate = function() {
    var label = this.container.find(".desc").removeClass("desc").addClass("slate");
    this.container.find(".type").text("slate");
    this.container.find("*").unbind("click");
    this.container.find(".arrow").removeClass("arrow").addClass("arrow-p");
    
    var slate = new Slate(this.obj, this.ctx, this.container);
    slate.draw();
}

function Slate(obj, ctx, container) {
    this.obj = obj;
    this.ctx = ctx;
    this.container = container;
    this.id = randomString(20);
    
    if(typeof container == "undefined") {
        this.container = generateContainer("slate", "flex-horizontal");
        this.ctx.append(this.container);
    }
}

Slate.prototype.draw = function() {
    this.container.find(".arrow").removeClass("arrow").addClass("arrow-p");
    var types = generateSelect(["", "union", "diff", "inter", "sinter", "desc", "chain", "ref", "super"]);
    
    var _this = this;
    types.change(function() {
        var chosen = $(this).val();
        _this.container.find(".type").text(chosen);
        _this.container.find(".slate").removeClass("slate").addClass(chosen);
        _this.container.find(".typeSelect").remove();
        _this.container.find(".arrow-p").removeClass("arrow-p").addClass("arrow");
        
        if(chosen == "chain") {
            _this.container.find(".flex-vertical").removeClass("flex-vertical").addClass("flex-horizontal");
            _this.obj["chain"] = [];
            var toDraw = new Chain(_this.obj, _this.ctx, _this.container);
            toDraw.draw();
        }
        else if(chosen == "desc") {
            _this.container.find(".flex-vertical").removeClass("flex-vertical").addClass("flex-horizontal");
            _this.obj["desc"] = [{}, {}];
            var toDraw = new Desc(_this.obj, _this.ctx, _this.container);
            toDraw.draw();
        }
        else if(chosen == "ref") {
            _this.container.find(".flex-vertical").removeClass("flex-vertical").addClass("flex-horizontal");
            _this.obj["ref"] = "";
            var toDraw = new Ref(_this.obj, _this.ctx, _this.container);
            toDraw.draw();
        }
        else if(chosen == "super") {
            _this.container.find(".flex-vertical").removeClass("flex-vertical").addClass("flex-horizontal");
            _this.obj[chosen] = {};
            var toDraw = new UniOp(_this.obj, _this.ctx, _this.container);
            toDraw.draw();
        }
        else if(chosen == "union" || chosen == "diff" || chosen == "inter" || chosen == "sinter") {
            _this.container.find(".flex-horizontal").removeClass("flex-horizontal").addClass("flex-vertical");
            _this.obj[chosen] = [{}, {}];
            var toDraw = new SetOp(_this.obj, _this.ctx, _this.container);
            toDraw.draw();
        }
    });
    
    this.container.find(".content").append("<div class='typeSelect'></div>");
    this.container.find(".typeSelect").append(types);
}

function UniOp(obj, ctx, container) {
    this.obj = obj;
    this.ctx = ctx;
    this.container = container;
    this.id = randomString(20);
    
    if(typeof container == "undefined") {
        var keys = Object.keys(this.obj);
        var op = keys[0];
        this.container = generateContainer(op, "flex-horizontal");
        this.ctx.append(this.container);
    }
}

UniOp.prototype.draw = function() {
    var _this = this;
    this.container.find(".destroy").click(function() {
        _this.destroy(); 
    });
    
    var keys = Object.keys(this.obj);
    var op = keys[0];
    var content = this.container.find(".content");
    resolveType(this.obj[op], content).draw();
}

UniOp.prototype.destroy = function() {
    var keys = Object.keys(this.obj);
    var op = keys[0];
    
    for(var member in this.obj) {
        delete this.obj[member];
    }
    this.container.find(".content").empty();
    
    this.convertToSlate(op);
}

UniOp.prototype.convertToSlate = function(op) {
    var label = this.container.find("." + op).addClass("slate").removeClass(op);
    this.container.find(".type").text("slate");
    this.container.find("*").unbind("click");
    this.container.find(".arrow").removeClass("arrow").addClass("arrow-p");
    
    var slate = new Slate(this.obj, this.ctx, this.container);
    slate.draw();
}

function Chain(obj, ctx, container) {
    this.obj = obj;
    this.chain = obj.chain;
    this.ctx = ctx;
    this.container = container;
    this.id = randomString(20);
    
    if(typeof container == "undefined") {
        this.container = generateContainer("chain", "flex-horizontal");
        this.ctx.append(this.container);
    }
}

Chain.prototype.destroy = function(/*container*/) {
    for(var member in this.obj) {
        delete this.obj[member];
    }
    this.container.find(".content").empty();
    
    this.convertToSlate();
}

Chain.prototype.convertToSlate = function() {
    var label = this.container.find(".chain");
    label.removeClass("chain");
    label.addClass("slate");
    this.container.find(".type").text("slate");
    this.container.find("*").unbind("click");
    this.container.find(".arrow").removeClass("arrow").addClass("arrow-p");
    
    var slate = new Slate(this.obj, this.ctx, this.container);
    slate.draw();
}

var gChain;
Chain.prototype.addLink = function(sibID) {
    var linkIndex = parseInt(sibID.substr(28)) + 1;
    
    /*let*/var newLink = this.blankLink(this.id + "_linkID_" + linkIndex);
    
    // update ids CORRECTLY
    var toChange = [];
    for(var i = linkIndex; i < this.chain.length; i++) {
        var elem = this.container.find("#" + this.id + "_linkID_" + i);
        toChange.push(elem);//.attr("id",  this.id + "_linkID_" + (i + 1));
    }
    for(var i = 0; i < toChange.length; i++) {
        var idNum = parseInt(toChange[i][0].id.substr(28)) + 1;
        toChange[i].attr("id", this.id + "_linkID_" + idNum);
    }
    //newLink.attr("id", this.id + "_linkID_" + linkIndex);
    this.addLinkListeners(newLink);
    
    this.chain.splice(linkIndex, 0, {});

    var sibling = this.container.find("#" + sibID);
    newLink.insertAfter(sibling);
    
    this.specialize("id", newLink, false);
}

Chain.prototype.advanceLink = function(linkID) {
    var linkInd = parseInt(linkID.substr(28));
    
    if(linkInd < this.chain.length - 1) {
        var neighborID = this.getRelLink(linkID, 1);

        var link = this.container.find("#" + linkID);
        var neighbor = this.container.find("#" + neighborID);

        this.container.find("#" + linkID).insertAfter(this.container.find("#" + neighborID));
        neighbor.attr("id", linkID);
        link.attr("id", neighborID);

        var temp = this.chain[linkInd];
        this.chain[linkInd] = this.chain[linkInd + 1];
        this.chain[linkInd + 1] = temp;
    }
    else {
        alert("NO CAN DO");
    }
}

Chain.prototype.closeLink = function(linkID) {
    var linkInd = parseInt(linkID.substr(28));
    var toRemove = this.container.find("#" + linkID);
    
    var toChange = [];
    for(var i = linkInd + 1; i < this.chain.length; i++) {
        var elem = this.container.find("#" + this.id + "_linkID_" + i);
        toChange.push(elem);//.attr("id",  this.id + "_linkID_" + (i + 1));
    }
    for(var i = 0; i < toChange.length; i++) {
        var idNum = parseInt(toChange[i][0].id.substr(28)) - 1;
        toChange[i].attr("id", this.id + "_linkID_" + idNum);
    }
    
    this.chain.splice(linkInd, 1);
    
    if(this.chain.length == 0) {
        this.drawEmpty();
    }
    
    toRemove.remove();
}

Chain.prototype.retractLink = function(linkID) {
    var linkInd = parseInt(linkID.substr(28));
    
    if(linkInd >= 1) {
        var neighborID = this.getRelLink(linkID, -1);

        var link = $("#" + linkID);
        var neighbor = $("#" + neighborID);

        this.container.find("#" + linkID).insertBefore(this.container.find("#" + neighborID));
        neighbor.attr("id", linkID);
        link.attr("id", neighborID);

        var temp = this.chain[linkInd];
        this.chain[linkInd] = this.chain[linkInd - 1];
        this.chain[linkInd - 1] = temp;
    }
    else {
        alert("NO CAN DO");
    }
}

Chain.prototype.getRelLink = function(linkID, adv) {
    var linkIDNum = parseInt(linkID.substr(28)) + adv;
    return this.id + "_linkID_" + linkIDNum;
}

Chain.prototype.addLinkListeners = function(link) {
    var _this = this;
    link.find(".linkHeaderAdd").click(function() {
        _this.addLink(link[0].id);
    });
    link.find(".linkHeaderAdvance").click(function() {
        _this.advanceLink(link[0].id);
    });
    link.find(".linkHeaderRetract").click(function() {
        _this.retractLink(link[0].id);
    });
    link.find(".linkHeaderClose").click(function() {
        _this.closeLink(link[0].id);
    });
}

Chain.prototype.draw = function () {
    //let container = generateContainer("chain", "flex-horizontal");    
    var content = this.container.find(".content");
    //this.ctx.append(this.container);
    var _this = this;
    
    this.container.find(".destroy").click(function() {
        _this.destroy(); 
    });
    
    gsp = this.obj;
    if(this.chain.length == 0) {
        this.drawEmpty();
    }
    else {
        for(var i = 0; i < this.chain.length; i++) {
            (function() {
                var index = i;
                var link = _this.blankLink(_this.id + "_linkID_" + index);
                //link.attr("id", this.id + "_linkID_" + i);
                _this.addLinkListeners(link);
                link.appendTo(content);

                var title = link.find(".linkHeaderTitle");

                var name = Object.keys(_this.chain[index])[0];
                var dashInd = name.indexOf("-");
                name = name.substr(0, dashInd);
                _this.specialize(name, link, true);
            })();
        }
    }
}

Chain.prototype.drawEmpty = function() {
    var _this = this;
    var addButton = $("<div class='addChain'><i class='material-icons'>add_circle_outline</i></div>");
    addButton.click(function() {
        _this.container.find(addButton).remove();
        var newLink = _this.blankLink(_this.id + "_linkID_" + 0);
        //newLink.attr("id", _this.id + "_linkID_" + 0);
        _this.addLinkListeners(newLink);
        _this.container.find(".content").append(newLink);
        _this.specialize("id", newLink, false);
        _this.chain.push({});
    });
    this.container.find(".content").append(addButton);
}

var gselect;
Chain.prototype.blankLink = function(id) {
    var link = $("<div id='" + id + "'></div>");
    link.addClass("link");
    link.addClass(this.id);
    
    //var header = $("<div class='linkHeader'><span class='linkHeaderTitle'></span><span class='linkHeaderClose'><i class='material-icons' style='font-size:10px'>close</i></span></div>");
    var headerString = "<div class='linkHeader'>";
    
    headerString += "<span class='float-left'>";
    headerString += "<span class='linkHeaderButton linkHeaderAdd'><i class='material-icons' style='font-size:10px'>add</i></span>";
    headerString += "<span class='linkHeaderButton linkHeaderRetract'><i class='material-icons' style='font-size:10px'>arrow_back</i></span>";
    headerString += "<span class='linkHeaderButton linkHeaderAdvance'><i class='material-icons' style='font-size:10px'>arrow_forward</i></span>";
    headerString += "</span>";
    
    headerString += "<span class='linkHeaderTitle'></span>";
    headerString += "<span class='linkHeaderButton linkHeaderClose'><i class='material-icons' style='font-size:10px'>close</i></span>";
    headerString += "</div>";
    
    var header =  $(headerString);
    
    var select = generateSelect(["id", "class", "prop", "contents", "tag", "parent", "child",
                                    "sibling", "nav", "distance", "visibility", "deepest"]);
    
    var _this = this;
    select.change(function(e) {
        //_this.serializeLink(link);
        _this.specialize(this.value, link, false);
    });
    
    var body = $("<div class='linkBody'></div>");
    
    header.find(".linkHeaderTitle").append(select);
    
    link.append(header);
    link.append(body);

    return link;
}

Chain.prototype.specialize = function(type, link, hasContent) {
    var body = link.find(".linkBody");
    body.html("");
    var linkIndex = link[0].id.substr(28);
    
    if(typeof linkIndex != "undefined") {
        link.find(".linkHeader").find("select").val(type);
    }
    
    //var relatives = new Set(["parent", "child", "sibling", "distance"]);
    var relatives = ["parent", "child", "sibling", "distance"];
    
    /*let*/var _this = this;
    if(type == "id") {
        var equality = $("<input type='text' style='width:15%; margin:2px' />");
        equality.addClass("idOpVal");
        var text = $("<input type='text' class='idVal' style='width:70%; margin:2px'/>");
        body.append(equality);
        body.append(text);
        
        equality.keyup(function() { _this.serializeLink(link) });
        text.keyup(function() { _this.serializeLink(link) });
        
        /*if(hasContent) {   
            var val = this.chain[linkIndex]["id-"];
            var op = val[0];
            var id = val.substr(1);
            equality.val(op);
            text.val(id);
        }*/
        if(hasContent) {   
            var val = this.chain[linkIndex]["id-"];
            var op = val[0];
            var idName = val.substr(1);
            
            if(op == "[") {
                var closeIndex = val.indexOf("]");
                op = val.substr(0, closeIndex + 1);
                idName = val.substr(closeIndex + 1);
            }
            
            equality.val(op);
            text.val(idName);
        }
    }
    else if(type == "class") {
        var equality = $("<input type='text' style='width:15%; margin:2px' />");
        equality.addClass("classOpVal");
        var text = $("<input type='text' class='classVal' style='width:70%; margin:2px'/>");
        body.append(equality);
        body.append(text);
        
        equality.keyup(function() { _this.serializeLink(link) });
        text.keyup(function() { _this.serializeLink(link) });
        
        if(hasContent) {   
            var val = this.chain[linkIndex]["class-"];
            var op = val[0];
            var className = val.substr(1);
            
            if(op == "[") {
                var closeIndex = val.indexOf("]");
                op = val.substr(0, closeIndex + 1);
                className = val.substr(closeIndex + 1);
            }
            
            equality.val(op);
            text.val(className);
        }
    }
    else if(type == "prop") {
        var prop = $("<input type='text' class='propType' style='width:30%; margin:2px' placeholder='attr' />");
        var text = $("<input type='text' class='propVal' style='width:55%; margin:2px' placeholder='value' />");
        body.append(prop);
        body.append(text);
        
        prop.keyup(function() { _this.serializeLink(link) });
        text.keyup(function() { _this.serializeLink(link) });
        
        if(hasContent) {  
            var name = Object.keys(this.chain[linkIndex])[0];
            var dashInd = name.indexOf("-");
            var propName = name.substr(dashInd + 1);
            var val = this.chain[linkIndex][name];
            prop.val(propName);
            text.val(val);
        }
    }
    else if(type == "contents") {
        //var equality = generateSelect(["=", "+", "^"]);
        var equality = $("<input type='text' style='width:15%; margin:2px' />");
        //equality.css("width:15%");
        //equality.css("margin:2px");
        equality.addClass("contentsOpVal");
        var text = $("<input type='text' class='contentsVal' style='width:70%; margin:2px'/>");
        var length = $("<input type='text' class='lengthVal' style='width:30%; margin:2px' placeholder='length' />");
        body.append(equality);
        body.append(text);
        body.append(length);
        
        equality.change(function() { _this.serializeLink(link) });
        text.keyup(function() { _this.serializeLink(link) });
        length.keyup(function() { _this.serializeLink(link) });
        
        if(hasContent) {  
            var name = Object.keys(this.chain[linkIndex])[0];
            var dashInd = name.indexOf("-");
            var lengthVal = name.substr(dashInd + 1);
            var val = this.chain[linkIndex][name];
            var op = val[0];
            var match = val.substr(1);
            
            if(op == "[") {
                var closeIndex = val.indexOf("]");
                op = val.substr(0, closeIndex + 1);
                match = val.substr(closeIndex + 1);
            }
            
            if(lengthVal.length > 0) {
                length.val(lengthVal);
            }
            equality.val(op);
            text.val(match);
        }
    }
    else if(type == "tag") {
        var tag = $("<input type='text' class='tagVal' style='width:50%; margin:2px' placeholder='tag' />");
        body.append(tag);
        
        tag.keyup(function() { _this.serializeLink(link) });
        
        if(hasContent) {   
            var tagName = this.chain[linkIndex]["tag-"].substr(1);
            tag.val(tagName);
        }
    }
    else if(type == "nav") {
        var sequence = $("<input type='text' class='seqVal' style='width:90%; margin:2px' placeholder='sequence' />");
        body.append(sequence);
        
        sequence.keyup(function() { _this.serializeLink(link) });
        
        if(hasContent) {   
            var navSeq = this.chain[linkIndex]["nav-"];
            sequence.val(navSeq);
        }
    }
    else if(type == "visibility") {
        var visVal = $("<input type='text' class='visVal' style='width:90%; margin:2px' placeholder='visibility' />");
        visVal.keyup(function() { _this.serializeLink(link) });
        
        body.append(visVal);
        if(hasContent) {
            visVal.val(this.chain[linkIndex]["visibility-"]);
        }
    }
    else if(type == "deepest") {
        var deepVal = generateSelect(["true", "false"]);
        $(deepVal).addClass("deepVal");
        $(deepVal).change(function() { _this.serializeLink(link) });
        
        body.append(deepVal);
        deepVal.css("margin", "2px");
        if(hasContent) {
            var actualVal = this.chain[linkIndex]["deepest-"];
            if(actualVal == true) {
                deepVal.val("true");
            }
            else {
                deepVal.val("false");
            }
        }
    }
    else if(relatives.indexOf(type) >= 0) {
        if(hasContent) {
            var name = Object.keys(this.chain[linkIndex])[0];
            var val = this.chain[linkIndex][name];
            //alert(JSON.stringify(val));
            resolveType(val, link.find(".linkBody")).draw();
        }
        else {
            for(var member in this.chain[linkIndex]) {
                delete this.chain[linkIndex][member];
            }
            this.chain[linkIndex][type + "-"] = {};
            var slate = new Slate(this.chain[linkIndex][type + "-"], link.find(".linkBody"));
            slate.draw();
        }
        
        if(type == "distance") {
            // do something correct with this
        }
    }
}

Chain.prototype.serializeLink = function(link) {
    var index = link[0].id.substr(28);
    
    this.chain[index] = {};
    var idPrefix = this.id + "_linkID_";
    var id = link[0].id;
    var type = link.find(".linkHeader").find("select").val();
    
    //console.log("my type is " + type);
    
    if(type == "id") {
        var name = link.find(".idVal").val();
        var op = link.find(".idOpVal").val();
        //console.log(name + ", " + op);
        
        var prefix = "id-";
        var postfix = op + name;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "class") {
        var name = link.find(".classVal").val();
        var op = link.find(".classOpVal").val();
        //console.log(name + ", " + op);
        
        var prefix = "class-";
        var postfix = op + name;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "prop") {
        var type = link.find(".propType").val();
        var val = link.find(".propVal").val();
        //console.log(type + ", " + val);
        
        var prefix = "prop-" + type;
        var postfix = val;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "contents") {
        var op = link.find(".contentsOpVal").val();
        var contents = link.find(".contentsVal").val();
        var length = link.find(".lengthVal").val();
        //console.log(op + ", " + contents + ", " + length);
        
        var prefix = "contents-" + length;
        var postfix = op + contents;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "tag") {
        var tag = link.find(".tagVal").val();
        //console.log(tag);
        
        var prefix = "tag-";
        var postfix = "=" + tag;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "visibility") {
        var visVal = link.find(".visVal").val();
        //console.log(visVal);
        
        var prefix = "visiblity-";
        var postfix = "=" + visVal;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "deepest") {
        var deepVal = link.find(".deepVal").val();
        //console.log(deepVal);
        
        var prefix = "deepest-";
        var postfix = "=" + deepVal;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "parent") {
        
    }
    else if(type == "child") {
        
    }
    else if(type == "sibling") {
        
    }
    else if(type == "nav") {
        var seq = link.find(".seqVal").val();
        //console.log(seq);
        
        var prefix = "nav-";
        var postfix = seq;
        this.chain[index][prefix] = postfix;
    }
    else if(type == "distance") {
        
    }
}

function generateSelect(options) {
    var select = $("<select></select");
    for(var i = 0; i <options.length; i++) {
        select.append("<option value='" + options[i] + "'>" + options[i] + "</option>");
    }
    return select;
}

/* Generate a random string of LENGTH characters
* useful for matching participants across linked experiments
*/
function randomString(length) {
	var str = "";
	for(var i = 0; i < length; i++) {
		var charCode = 0;
		if(Math.random() < (26 / 36))
			charCode = Math.floor(Math.random() * 26) + 97;
		else
			charCode = Math.floor(Math.random() * 10) + 48;
			
		str += String.fromCharCode(charCode);
	}
	
	return str;
}