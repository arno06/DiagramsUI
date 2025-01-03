(function(){
    const TEXT_HEIGHT = 90;
    const TEXT_MARGIN = 40;
    const LINE_MARGIN = 10;
    const SEPARATOR_MARGIN = 10;
    const GENERIC_MARGIN = 10;
    const SPACE_INSTRUCTIONS = '    ';
    let renderTO;

    class Sequence{
        constructor(pTitle = null, pColumns = []){
            this.direction = "right";
            this.columns = pColumns.concat([]);
            this.elements = [];
            if( pTitle != null){
                this.elements.push({
                    type:"title", text:pTitle
                });
            }
        }

        addText(pColumn, pString){
            this.elements.push({type:"text", column:pColumn, text:pString});
        }

        addSegment(pColumns, pArrows = [], pClass = 'segment', pDescription = ''){
            this.elements.push({
                type:"segment",
                columns:pColumns,
                arrows: pArrows,
                class: pClass,
                description: pDescription
            });
        }

        addSeparator(){
            this.elements.push({type:'separator'});
        }

        addBreakLine(){
            this.elements.push({type:'breakline'});
        }

        render(pSvg, pStartingY, pDistance){
            let addTextHeight = false;
            let group = SVGElement.create('g', {}, pSvg);
            let cols = {};
            this.columns.forEach(function(pCol, pIndex){
                let bx = (pDistance * pIndex) + GENERIC_MARGIN;
                cols[pCol.id] = {x: bx, xBeforeText:bx + (pDistance>>1), xAfterText:bx + (pDistance>>1), index:pIndex};
            });

            for(let i = 0, max = this.elements.length; i<max; i++){
                let el = this.elements[i];
                switch(el.type){
                    case "title":
                        addTextHeight = false;
                        let title = SVGElement.create('text', {innerHTML:el.text, x:GENERIC_MARGIN<<1, y:pStartingY + GENERIC_MARGIN}, group);
                        let box = title.getBBox();
                        pStartingY += box.height + GENERIC_MARGIN;
                        break;
                    case "separator":
                        addTextHeight = false;
                        let y = pStartingY + TEXT_HEIGHT + SEPARATOR_MARGIN;
                        SVGElement.create('line', {class:'separator', x1:GENERIC_MARGIN, y1:y, x2:(pDistance*this.columns.length) + GENERIC_MARGIN, y2:y}, group);
                        pStartingY = y + SEPARATOR_MARGIN;
                        break;
                    case "breakline":
                        addTextHeight = false;
                        pStartingY +=  TEXT_HEIGHT + (SEPARATOR_MARGIN<<1);
                        break;
                    case "text":
                        addTextHeight = true;
                        if(!cols.hasOwnProperty(el.column)){
                            console.warn("no cols "+el.column);
                            continue;
                        }
                        let col = cols[el.column];
                        let fo = SVGElement.create("foreignObject", {width: pDistance - (TEXT_MARGIN<<1), height:TEXT_HEIGHT, x: col.x+TEXT_MARGIN, y:pStartingY}, group);
                        let cache = Element.create("div", {"class":"cache"}, fo);
                        let div = Element.create("div", {"data-name":"description", "data-type":"html", "innerHTML":el.text, "class":"wysiwyg-text-align-center"}, cache);
                        if(div.offsetWidth<fo.width.baseVal.value){
                            fo.setAttribute("width", div.offsetWidth);
                            fo.setAttribute("x", col.x + (pDistance>>1) - (div.offsetWidth>>1));
                        }
                        let x1 = Number(fo.getAttribute("x"));
                        let x2 = x1 + div.offsetWidth;
                        if(this.direction === "right"){
                            cols[el.column].xBeforeText = x1;
                            cols[el.column].xAfterText = x2;
                        }else{
                            cols[el.column].xBeforeText = x2;
                            cols[el.column].xAfterText = x1;
                        }
                        let s = group.querySelector('line.segment[data-to^="'+el.column+(pStartingY+(TEXT_HEIGHT>>1))+'"]');
                        if(s){
                            let coef = this.direction === "right"?1:-1;
                            let nx2 = String(cols[el.column].xBeforeText - (LINE_MARGIN*coef));
                            if(s.getAttribute('x1') === s.getAttribute("x2")){
                                s.setAttribute("x1", nx2);
                            }
                            s.setAttribute("x2", nx2);
                            group.querySelectorAll('*[data-segment="'+s.getAttribute("id")+'"]').forEach(function(pElement){
                                let descBox = pElement.getBBox();
                                pElement.setAttribute("x", ((Number(s.getAttribute('x1')) + Number(s.getAttribute('x2')))>>1) - (descBox.width>>1));
                            });
                        }
                        break;
                    case "segment":
                        addTextHeight = true;
                        let one = el.columns[0];
                        let sec = el.columns[1];
                        let coef = this.direction === "right"?1:-1;
                        let xfrom = cols[one].xAfterText + (LINE_MARGIN*coef);
                        let xto = cols[sec].xBeforeText - (LINE_MARGIN*coef);
                        let yfrom = pStartingY + (TEXT_HEIGHT>>1)
                        let yto = yfrom;
                        if(one===sec){
                            yto += TEXT_HEIGHT;
                            pStartingY += TEXT_HEIGHT;
                            xto = xfrom;
                            this.direction = this.direction==="right"?"left":"right";
                        }
                        let idSec = 'seg_'+one+sec+yfrom;
                        let attr = {id:idSec, class:'segment', 'x1':xfrom, "y1":yfrom, "x2":xto, "y2":yto, "data-from":one+yfrom, "data-to":sec+yto};
                        if(el.class === "dashed"){
                            attr['stroke-dasharray'] = '5,5';
                        }
                        let line = SVGElement.create('line', attr, group);

                        if(el.arrows[0] === one){
                            line.setAttribute("marker-start", "url(#arrowLeft)");
                        }
                        if(el.arrows[1] === sec){
                            line.setAttribute("marker-end", "url(#arrowRight)");
                        }
                        if(el.description){
                            let desc = SVGElement.create('text', {innerHTML:el.description, x:xfrom, y:yfrom  - 10, class:'segment_description', 'data-segment':idSec}, group);
                            let descBox = desc.getBBox();
                            desc.setAttribute("x", ((xfrom + xto)>>1) - (descBox.width>>1));
                            SVGElement.create('rect', {width:descBox.width, height:descBox.height, x:desc.getAttribute("x"), y:descBox.y, fill:'#fff', 'data-segment':idSec}, group, desc);
                        }
                        break;
                }
            }
            this.endingY = pStartingY + (addTextHeight?TEXT_HEIGHT:0);
        }
    }

    class Sequential{

        constructor(){
            this.columns = [];
            this.sequences = [];
        }

        addColumn(pName, pId = null){
            this.columns.push({
                id:pId,
                label:pName
            });
        }

        addSequence(pTitle = null){
            let s = new Sequence(pTitle, this.columns);
            this.sequences.push(s);
            return s;
        }

        render(pSvg){
            let w = pSvg.width.baseVal.value - (GENERIC_MARGIN<<1);
            let count = this.columns.length;

            let svgHeight = pSvg.height.baseVal.value;

            let distance = Math.round(w / count);

            SVGElement.create("line", {x1:GENERIC_MARGIN, y1: 60, x2: w+GENERIC_MARGIN, y2:60, class:"segment"}, pSvg);

            for(let i = 0; i<count; i++){
                let cx = GENERIC_MARGIN + (distance * i);
                let fo = SVGElement.create("foreignObject", {width: distance, height:20, x: cx, y:20}, pSvg);
                let cache = Element.create("div", {"class":"cache"}, fo);
                Element.create("div", {"data-name":"description", "data-type":"html", "innerHTML":this.columns[i].label, "class":"wysiwyg-text-align-center"}, cache);
                if(i>0){
                    SVGElement.create("line", {"stroke-dasharray":"5, 5", x1:cx, y1: 10, x2:cx, y2:svgHeight - 20, class:"separator"}, pSvg);
                }
            }

            let currentY = 70;

            this.sequences.forEach(function(pSeq){
                pSeq.render(pSvg, currentY, distance);
                currentY = pSeq.endingY;
            });
            if(currentY>pSvg.getBoundingClientRect().height){
                pSvg.setAttribute('height', currentY+'px');
                pSvg.querySelectorAll(':scope>line.separator').forEach((pLine)=>{
                    pLine.setAttribute("y2", currentY);
                });
            }
        }

        evaluate(pDescription){
            let ref = this;
            let context = this;
            let action = null;
            let parser = null;
            let currentCursor = null;

            let parseColumn = function(pInstruction){
                let params = pInstruction.replace(SPACE_INSTRUCTIONS, '').split(':').reverse();
                if(params.length===1){
                    params.push(params[0].toLowerCase());
                }
                return params;
            };
            let parseSequence = function(pInstruction){
                pInstruction = pInstruction.replace(SPACE_INSTRUCTIONS, '');
                if(pInstruction==='---'){
                    action = 'addSeparator';
                    return [];
                }
                if(pInstruction==='//'){
                    console.log("addBreakLine");
                    action = 'addBreakLine';
                    return [];
                }
                let re = /(<-+>|<-+|-+>|-+)/;
                if(re.test(pInstruction)){
                    let parts = pInstruction.split(':');
                    pInstruction = parts[0];
                    let comment = parts[1]||'';

                    action = 'addSegment';
                    let cls = "segment";
                    let arrows = [null, null];
                    let cols = pInstruction.split(re);
                    let type = cols.splice(1, 1);
                    if(/--/.test(type)){
                        cls = "dashed";
                    }
                    cols[0] = cols[0]||currentCursor;
                    currentCursor = cols[1];
                    if(pInstruction.indexOf('<')!==-1){
                        arrows[0] = cols[0];
                    }
                    if(pInstruction.indexOf('>')!==-1){
                        arrows[1] = cols[1];
                    }
                    return [cols, arrows, cls, comment];
                }
                action = 'addText';
                const r = pInstruction.split(':');
                currentCursor = r[0]||currentCursor;
                return r;
            }
            pDescription = pDescription.map(function(pEntry){
                return pEntry.replace(SPACE_INSTRUCTIONS, '');
            });
            pDescription.forEach(function(pInstruction){
                if(context&&action&&pInstruction.indexOf(SPACE_INSTRUCTIONS)===0){
                    let params = parser(pInstruction);
                    context[action].apply(context, params);
                    return;
                }
                let type = pInstruction.split(':');
                switch(type[0]){
                    case "columns":
                        action = 'addColumn';
                        parser = parseColumn;
                        return;
                    case "sequence":
                        context = ref.addSequence(type[1]||null);
                        action = 'sequence';
                        parser = parseSequence;
                        return;
                    case "//":
                        context.addBreakLine();
                        break;
                    case "---":
                        context.addSeparator();
                        break;
                    default:
                        action = null;
                        return;
                }
            });
        }
    }

    class Flow
    {
        _blocks = {};
        _lines = [];

        constructor() {

        }

        addBlock(pId, pType, pDimensions, pContent = ""){
            console.log("addBlock");
            console.log(arguments);
            //top,right,bottom,left
            let anchors = [];
            let element;
            let x = pDimensions[0];
            let y = pDimensions[1];
            let points;
            switch(pType){
                case "rectangle":
                    element = SVGElement.create("rect", {
                        x:0,
                        y:0,
                        width:pDimensions[2],
                        height:pDimensions[3],
                    });
                    anchors = [
                        [x+(pDimensions[2]/2), y],
                        [x+pDimensions[2], y+(pDimensions[3]/2)],
                        [x+(pDimensions[2]/2), y + pDimensions[3]],
                        [x, y+(pDimensions[3]/2)]
                    ];
                    break;
                case "circle":
                    element = SVGElement.create("circle", {
                        cx:0,
                        cy:0,
                        r:pDimensions[2]
                    });
                    anchors = [
                        [x, y - pDimensions[2]],
                        [x+pDimensions[2], y],
                        [x, y + pDimensions[2]],
                        [x-pDimensions[2], y]
                    ];
                    break;
                case "triangle":
                    let side = pDimensions[2];
                    let ny = Math.sqrt((side * side) - ((side/2) * (side/2)));
                    points = ["0,0", (side/2)+","+(ny), (-(side/2))+","+(ny)];
                    element = SVGElement.create("polygon", {
                        points:points.join(" ")
                    });
                    anchors = [
                        [x, y],
                        [(x + (x+(side/2)))/2, (y + (y+ny))/2],
                        [x, y+ny],
                        [(x + (x-(side/2)))/2, (y + (y+ny))/2],
                    ];
                    break;
                case "diamond":
                    let w = pDimensions[2];
                    let h = pDimensions[3];
                    points = ["0,0", (w/2)+","+(h/2), "0,"+(h), (-(w/2))+","+(h/2)];
                    element = SVGElement.create("polygon", {
                        points:points.join(" ")
                    });
                    anchors = [
                        [x, y],
                        [x+(w/2), y + (h/2)],
                        [x, y + h],
                        [x-(w/2), y + (h/2)]
                    ];
                    break;
                default:
                    return;
            }
            const group = SVGElement.create("g", {
                "class":"block_element",
                "transform":"translate("+x+","+y+")"
            });
            const txt = SVGElement.create("foreignObject",{width:pDimensions[2], height:100});
            txt.innerHTML = "<div>"+pContent+"</div>";
            group.appendChild(element);
            group.appendChild(txt);
            this._blocks[pId] = {
                element:group,
                position:[x,y],
                anchors:anchors
            };
        }

        addLink(pFrom, pTo){
            if(!pFrom || !pTo){
                return;
            }
            let attr = {class:'segment', 'x1':pFrom[0], "y1":pFrom[1], "x2":pTo[0], "y2":pTo[1]};
            let line = SVGElement.create('line', attr);
            this._lines.push(line);
        }

        evaluate(pDescription){
            let ref = this;
            let context = this;
            let action = null;
            let parser = null;
            let currentCursor = null;

            const parseBlock = function(pInstructions){
                let parts = pInstructions.split(":");
                const id = parts[0].trim();
                parts = parts[1].split("@");
                const dimensions = parts[1].split(",");

                let content = "";
                let infos = "";
                let type = "rect";

                if((infos = /\[([^\]]*)]/.exec(parts[0])) !== null){
                    type = "rectangle";
                    content = infos[1];
                }
                if((infos = /\(([^\]]*)\)/.exec(parts[0])) !== null){
                    type = "circle";
                    content = infos[1];
                }
                if((infos = /\/([^\]]*)\\/.exec(parts[0])) !== null){
                    type = "triangle";
                    content = infos[1];
                }
                if((infos = /\/([^\]]*)\//.exec(parts[0])) !== null){
                    type = "diamond";
                    content = infos[1];
                }

                return [id, type, dimensions.map(Number), content];
            };

            const parseLink = function(pInstruction){
                pInstruction = pInstruction.replace(SPACE_INSTRUCTIONS, '');
                let re = /(<-+>|<-+|-+>|-+)/;
                if(re.test(pInstruction)){

                    let cols = pInstruction.split(re);
                    const b1 = ref._blocks[cols[0]];
                    const b2 = ref._blocks[cols[2]];
                    if(!b1 || !b2){
                        return null;
                    }

                    let from = null;
                    let to = null;
                    let dist = null;

                    b1.anchors.forEach((pC1)=>{
                        b2.anchors.forEach((pC2)=>{
                            let d = Math.sqrt(((pC2[0]-pC1[0]) * (pC2[0]-pC1[0])) + ((pC2[1]-pC1[1]) * (pC2[1]-pC1[1])));
                            if(dist === null || dist > d){
                                dist = d;
                                from = pC1;
                                to = pC2;
                            }
                        });
                    });

                    return [from, to];
                }
            };

            pDescription = pDescription.map(function(pEntry){
                return pEntry.replace(SPACE_INSTRUCTIONS, '');
            });
            pDescription.forEach(function(pInstruction){
                if(context&&action&&pInstruction.indexOf(SPACE_INSTRUCTIONS)===0){
                    let params = parser(pInstruction);
                    context[action].apply(context, params);
                    return;
                }
                let type = pInstruction.split(':');
                switch(type[0]){
                    case "blocs":
                        action = 'addBlock';
                        parser = parseBlock;
                        return;
                    case "links":
                        action = 'addLink';
                        parser = parseLink;
                        return;
                    default:
                        action = null;
                        return;
                }
            });
        }

        render(pSvg){
            for(let i in this._blocks){
                let element = this._blocks[i].element;
                pSvg.appendChild(element);

                continue;
                this._blocks[i].anchors.forEach((pCoord)=>{
                    SVGElement.create("rect", {
                        fill:"pink",
                        x:pCoord[0]-5,
                        y:pCoord[1]-5,
                        width:10,
                        height:10
                    }, pSvg);
                });
            }

            this._lines.forEach((pLine)=>{
                pSvg.appendChild(pLine);
            });
        }
    }


    function init(){
        document.querySelector('#export').addEventListener('click', exportHandler);
        document.querySelector('#description').addEventListener('keydown', keyDownHandler);
        document.querySelector('#description').addEventListener('keyup', keyUpHandler);
        evalAndRenderHandler();
    }

    function exportHandler(){
        Request.load('components/dui/style.css').onComplete(function(pEvent){
            SVGElement.toPNG(document.querySelector('#tree svg'), pEvent.currentTarget.responseText, ['https://fonts.googleapis.com/css?family=Roboto']).then((pPng)=>{
                let a = document.createElement("a");
                a.setAttribute("download", "diagram.png");
                a.setAttribute("href", pPng);
                document.body.appendChild(a);
                a.click();
                a.remove();
            });
        });
    }

    function keyDownHandler(e){
        if(e.keyCode === 9){
            e.preventDefault();
        }
    }

    function keyUpHandler(e){
        switch(e.keyCode){
            case 13:
                let val = e.currentTarget.value;
                let startSel = e.currentTarget.selectionStart;
                let newline = /\n/.test(val.substring(startSel-1,startSel));
                if(newline){
                    let index = startSel-2;
                    let nl = false;
                    while(index>0 && !nl){
                        nl = /\n/.test(val.substring(index, index+1));
                        if(nl){
                            let c = /\s+/.exec(val.substring(index+1, startSel-1));
                            e.currentTarget.value = val.substring(0, startSel) + c[0]+val.substring(startSel, val.length);
                            e.currentTarget.setSelectionRange(startSel+c[0].length, startSel+c[0].length);
                            break;
                        }else{
                            index -= 1;
                        }
                    }
                }
                break;
        }
        evalAndRenderHandler();
    }

    function evalAndRenderHandler(){
        if(renderTO){
            clearTimeout(renderTO);
        }
        renderTO = setTimeout(()=>{
            const svg = document.querySelector('#tree svg');
            //reset
            let children = svg.querySelectorAll(':scope>*:not(defs)');
            children.forEach(function(pNode){
                pNode.parentNode.removeChild(pNode);
            });

            let desc = document.querySelector('#description').value.split('\n');
            let entity = desc.shift();
            let instance;
            switch(entity){
                case "Sequential":
                    instance = new Sequential();
                    break;
                case "Flow":
                    instance = new Flow();
                    break;
                default:
                    return;
            }
            let t = new Date().getTime();
            instance.evaluate(desc);
            instance.render(svg);
            document.querySelector('#rendering').innerHTML = ((new Date()).getTime()-t)+"ms";
        }, 250);
    }

    window.addEventListener('DOMContentLoaded', init);
})();