// создаёт каталог products.json: COUNT питомцев, фотографии берутся по кругу
const fs = require('fs');

const COUNT = 5000;

// фотографии из папки public/img и их размеры в пикселях
const PHOTOS = [
  { img: 'img/cat1.jpg',    width: 600, height: 600 },
  { img: 'img/dog1.jpg',    width: 600, height: 600 },
  { img: 'img/rabbit.jpg',  width: 600, height: 534 },
  { img: 'img/hamster.jpg', width: 600, height: 600 },
  { img: 'img/img.7.jpg',   width: 600, height: 600 },
  { img: 'img/img.8.jpg',   width: 600, height: 487 },
  { img: 'img/img.9.jpg',   width: 600, height: 450 },
  { img: 'img/img.10.jpg',  width: 600, height: 600 },
  { img: 'img/img.11.jpg',  width: 600, height: 811 },
  { img: 'img/img.12.jpg',  width: 600, height: 741 }
];

const products = [];

for (let i = 1; i <= COUNT; i++) {
  const photo = PHOTOS[(i - 1) % PHOTOS.length];
  products.push({
    id: i,
    name: 'Питомец ' + i,
    price: 500 + (i * 37) % 2500,
    img: photo.img,
    width: photo.width,
    height: photo.height
  });
}

fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
console.log('Файл products.json создан: ' + products.length + ' товаров');
