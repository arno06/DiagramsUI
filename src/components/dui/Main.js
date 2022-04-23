(function(){
    const TEXT_HEIGHT = 90;
    const TEXT_MARGIN = 40;
    const LINE_MARGIN = 10;
    const SEPARATOR_MARGIN = 10;
    const GENERIC_MARGIN = 10;
    const SPACE_INSTRUCTIONS = '    ';

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
                        let y =pStartingY + TEXT_HEIGHT + SEPARATOR_MARGIN;
                        SVGElement.create('line', {class:'separator', x1:GENERIC_MARGIN, y1:y, x2:(pDistance*this.columns.length) + GENERIC_MARGIN, y2:y}, group);
                        pStartingY = y + SEPARATOR_MARGIN;
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
        }

        evaluate(pDescription){
            let ref = this;
            let context = this;
            let action = null;
            let parser = null;

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
                    if(pInstruction.indexOf('<')!==-1){
                        arrows[0] = cols[0];
                    }
                    if(pInstruction.indexOf('>')!==-1){
                        arrows[1] = cols[1];
                    }
                    return [cols, arrows, cls, comment];
                }
                action = 'addText';
                return pInstruction.split(':');
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


    function init(){
        let svg = document.querySelector('#tree svg');

        document.querySelector('#draw_button').addEventListener('click', evalAndRenderHandler);
    }


    function evalAndRenderHandler(e){
        let children = document.querySelectorAll('#tree svg>*:not(defs)');
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
            default:
                return;
        }
        instance.evaluate(desc);
        instance.render(document.querySelector('#tree svg'))
    }

    window.addEventListener('DOMContentLoaded', init);
})();