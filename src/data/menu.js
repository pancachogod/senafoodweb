import {
  lunchChicken,
  lunchFish,
  plateLemonade,
  plateRice,
  plateSalad,
} from '../assets/index.js';

const menuItems = [
  {
    id: 'pollo',
    name: 'Almuerzo Especial Pollo',
    description: 'Filete arroz, pollo a la plancha y ensalada fresca',
    price: 9600,
    image: lunchChicken,
    detail: {
      subtitle: 'Pollo a la plancha en su jugo',
      gallery: [lunchChicken, plateRice, plateLemonade],
    },
  },
  {
    id: 'pescado',
    name: 'Almuerzo Especial Pescado',
    description: 'Filete arroz, tilapia y ensalada fresca',
    price: 9500,
    image: lunchFish,
    detail: {
      subtitle: 'Tilapia al horno con ensalada',
      gallery: [lunchFish, plateSalad, plateLemonade],
    },
  },
];

const menuBenefits = [
  'Ingredientes frescos y naturales',
  'Preparado el mismo dia',
  'Recogida rapida con token',
];

export { menuItems, menuBenefits };
