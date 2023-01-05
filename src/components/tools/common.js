const NS_SVG = "http://www.w3.org/2000/svg";

let SVGElement = {
    create:function(pName, pAttributes, pParentNode, pInsertBefore)
    {
        return Element.create(pName, pAttributes, pParentNode, pInsertBefore, NS_SVG);
    },
    toPNG:function(pSvg, pCssString, pCssFiles){
        let svg = pSvg.cloneNode(true);
        if(pCssString){
            SVGElement.create("style", {innerHTML:pCssString}, svg, svg.firstChild);
        }
        if(pCssFiles){
            pCssFiles.forEach((pCssFileUrl)=>{
                SVGElement.create("style", {innerHTML:"@import url("+pCssFileUrl+");"}, svg, svg.firstChild);
            });
        }

        let cv = document.createElement("canvas");
        let ctx = cv.getContext("2d");

        let b = pSvg.getBoundingClientRect();

        cv.setAttribute("width", b.width+"px");
        cv.setAttribute("height", b.height+"px");

        return new Promise((pResolve, pReject)=>{
            let img = new Image();
            img.onload = function(){
                img.onload = null;
                ctx.drawImage(img, 0, 0);
                pResolve(cv.toDataURL("image/png"));
            };
            img.onerror = pReject;
            img.setAttribute("src", "data:image/svg+xml;utf8," + encodeURIComponent(new XMLSerializer().serializeToString(svg)));
        });
    }
};

let Element = {
    create:function(pName, pAttributes, pParentNode, pInsertBefore, pNs)
    {
        let element = pNs?document.createElementNS(pNs, pName):document.createElement(pName);

        for(let i in pAttributes)
        {
            if(!pAttributes.hasOwnProperty(i))
                continue;
            switch(i)
            {
                case "innerHTML":
                    element.innerHTML = pAttributes[i];
                    break;
                default:
                    element.setAttribute(i, pAttributes[i]);
                    break;
            }
        }

        if(pParentNode)
        {
            if(pInsertBefore)
            {
                pParentNode.insertBefore(element, pInsertBefore);
            }
            else
            {
                pParentNode.appendChild(element);
            }
        }

        return element;
    }
};