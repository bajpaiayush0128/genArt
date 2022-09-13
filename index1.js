const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const {
  layers,
  width,
  height,
  description,
  baseImageUrl,
  startEditionFrom,
  endEditionAt,
  editionSize,
  rarityWeights,
} = require("./input/config.js");
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
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
    dna: _dna.join(""),
    name: `#${_edition}`,
    description: description,
    image: `${baseImageUrl}/${_edition}`,
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
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_element) => {
  ctx.drawImage(
    _element.loadedImage,
    _element.layer.position.x,
    _element.layer.position.y,
    _element.layer.size.width,
    _element.layer.size.height
  );

  addAttributes(_element);
};

const constructLayerToDna = (_dna = [], _layer = [], _rarity) => {
  let mappedDnaToLayers = _layer.map((layer, index) => {
    let selectedElement = layer.elements[_rarity][_dna[index]];
    return {
      location: layer.location,
      position: layer.position,
      size: layer.size,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

const getRarity = (_editionCount) => {
  let rarity = "";
  rarityWeights.forEach((rarityWeight) => {
    if (
      _editionCount >= rarityWeight.from &&
      _editionCount <= rarityWeight.to
    ) {
      rarity = rarityWeight.value;
    }
  });
  return rarity;
};

const isDnaUnique = (_DnaList = [], _dna = []) => {
  let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
  return foundDna == undefined ? true : false;
};

const createDna = (_layers, _rarity) => {
  let randNum = [];
  _layers.forEach((layer) => {
    let num = Math.floor(Math.random() * layer.elements[_rarity].length);
    randNum.push(num);
  });
  return randNum;
};

const writeMetaData = (_data) => {
  fs.writeFileSync("./output/_metadata.json", _data);
};

const startCreating = async () => {
  writeMetaData("");
  let editionCount = startEditionFrom;
  while (editionCount <= endEditionAt) {
    let rarity = getRarity(editionCount);
    console.log(rarity);
    let newDna = createDna(layers, rarity);
    // console.log(`RandomNum ${newDna}`);
    // console.log(`DNA List ${dnaList}`);
    if (isDnaUnique(dnaList, newDna)) {
      let result = constructLayerToDna(newDna, layers, rarity);
      let loadedElements = [];
      result.forEach((layer) => {
        loadedElements.push(loadLayerImg(layer));
      });

      await Promise.all(loadedElements).then((elementArray) => {
        drawBackground();
        ctx.clearRect(0, 0, width, height);
        elementArray.forEach((element) => {
          drawElement(element);
        });
        signImage(`${editionCount}`);
        saveImage(editionCount);
        addMetaData(newDna, editionCount);
        // console.log(`Created edition: ${editionCount} with DNA: ${newDna}`);
      });

      editionCount++;
    } else {
      console.log("DNA exists!");
    }
  }
  writeMetaData(JSON.stringify(metadataList));
};

startCreating();
