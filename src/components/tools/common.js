const NS_SVG = "http://www.w3.org/2000/svg";

let SVGElement = {
    create:function(pName, pAttributes, pParentNode, pInsertBefore)
    {
        return Element.create(pName, pAttributes, pParentNode, pInsertBefore, NS_SVG);
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