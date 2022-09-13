const fs = require("fs");
const myArgs = process.argv.slice(2);
const { createCanvas, loadImage } = require("canvas");
const { layers, width, height } = require("./input/config.js");
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
const editionSize = myArgs.length > 0 ? Number(myArgs[0]) : 1;
var metadataList = [];
var attributesList = [];
var hash = [];
var decodedHash = [];
var dnaList = [];

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `./output/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const signImage = (_sig) => {
  ctx.fillStyle = "#000000";
  ctx.font = "bold 30pt Courier";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(_sig, 40, 40);
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, 85%)`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = genColor();
  ctx.fillRect(0, 0, width, height);
};

const addMetaData = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetaData = {
    dna: _dna,
    edition: _edition,
    date: dateTime,
    attributes: attributesList,
  };
  metadataList.push(tempMetaData);
  dnaList.push(_dna);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    name: selectedElement.name,
    rarity: selectedElement.rarity,
  });
  // let tempAttr = {
  //   id: _element.id,
  //   layer: _layer.name,
  //   name: _element.name,
  //   rarity: _element.rarity,
  // };
  // attributes.push(tempAttr);
  // hash.push(_layer.id);
  // hash.push(_element.id);
  // decodedHash.push({ [_layer.id]: _element.id });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(
      `${_layer.location}${_layer.selectedElement.fileName}`
    );
    resolve({ layer: _layer, loadedImage: image });
  });
  // let element =
  // _layer.elements[Math.floor(Math.random() * _layer.elements.length)];
  // addAttributes(element, _layer);
  // const image = await loadImage(`${_layer.location}${element.fileName}`);
  // ctx.drawImage(
  //   image,
  //   _layer.position.x,
  //   _layer.position.y,
  //   _layer.size.width,
  //   _layer.size.height
  // );
  // console.log(
  //   `I created the ${_layer.name} layer, and choose element ${element.name}`
  // );
  // saveLayer(canvas, _edition);
};

const drawElement = (_element) => {
  ctx.drawImage(
    _element.loadedImage,
    _element.layer.position.x,
    _element.layer.position.y,
    _element.layer.size.width,
    _element.layer.size.height
  );
  // ctx.drawImage(
  //   image,
  //   _layer.position.x,
  //   _layer.position.y,
  //   _layer.size.width,
  //   _layer.size.height
  // );
  addAttributes(_element);
};

const constructLayerToDna = (_dna, _layer) => {
  let DnaSegment = _dna.toString().match(/.{1,2}/g);
  let mappedDnaToLayers = _layer.map((layer) => {
    let selectedElement =
      layer.elements[parseInt(DnaSegment) % layer.elements.length];
    return {
      location: layer.location,
      position: layer.position,
      size: layer.size,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

const isDnaUnique = (_DnaList = [], _dna) => {
  let foundDna = _DnaList.find((i) => i === _dna);
  return foundDna == undefined ? true : false;
};

const createDna = (_len) => {
  let randNum = Math.floor(
    Number(`1e${_len}`) + Math.random() * Number(`9e${_len}`)
  );
  return randNum;
};

const writeMetaData = (_data) => {
  fs.writeFileSync("./output/_metadata.json", _data);
};

const startCreating = async () => {
  writeMetaData("");
  let editionCount = 1;
  while (editionCount <= editionSize) {
    let newDna = createDna(layers.length * 2 - 1);
    console.log(`RandomNum ${newDna}`);
    console.log(`DNA List ${dnaList}`);
    if (isDnaUnique(dnaList, newDna)) {
      let result = constructLayerToDna(newDna, layers);
      let loadedElements = [];
      result.forEach((layer) => {
        loadedElements.push(loadLayerImg(layer));
      });

      await Promise.all(loadedElements).then((elementArray) => {
        drawBackground();
        elementArray.forEach((element) => {
          drawElement(element);
        });
        signImage(`${editionCount}`);
        saveImage(editionCount);
        addMetaData(newDna, editionCount);
        console.log(`Created edition: ${editionCount} with DNA: ${newDna}`);
      });
      // layers.forEach((layer) => {
      //   loadLayerImg(layer, editionCount);
      // });
      // addMetaData(i);

      editionCount++;
    } else {
      console.log("DNA exists!");
    }
  }
  writeMetaData(JSON.stringify(metadataList));
  // for (let i = 1; i <= editionSize; i++) {
  //   layers.forEach((layer) => {
  //     drawLayer(layer, i);
  //   });
  //   addMetaData(i);
  // }
};

startCreating();

// fs.readFile("./output/_metadata.json", (err, data) => {
//   if (err) throw err;
// });
