import bag from './images/bag.jpg';
import scope from './images/scope.jpg';
import tube from './images/tube.jpg';
import suction from './images/suction.jpg';
import supraglottic from './images/supraglottic.jpg';
import sensor from './images/sensor.jpg';

export const equipmentPhotos = [
{id:"bag",label:"Bolsa e máscara",description:"Bolsa autoinflável e máscara facial; reservatório de oxigênio não mostrado.",author:"Hospital",license:"CC BY-SA 3.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0",source:"https://commons.wikimedia.org/wiki/File:Bag_Valve_Mask_(AMBU_-_bag).jpg",src:bag},
{id:"scope",label:"Videolaringoscópio",description:"Exemplo com tela integrada, cabo e lâmina curva.",author:"Jack7011",license:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0",source:"https://commons.wikimedia.org/wiki/File:Videolaryngoskop_McGRATH%C2%AE_MAC.jpg",src:scope},
{id:"tube",label:"Tubo traqueal",description:"Observe o conector, as marcações e o balão piloto ligado ao balonete.",author:"ICUnurses",license:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0",source:"https://commons.wikimedia.org/wiki/File:Endotracheal_Tube.JPG",src:tube},
{id:"suction",label:"Cânula de aspiração",description:"Ponta rígida de Yankauer, conectada ao sistema de aspiração durante o uso.",author:"ICUnurses",license:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0",source:"https://commons.wikimedia.org/wiki/File:Yankeur.jpg",src:suction},
{id:"supraglottic",label:"Dispositivo supraglótico",description:"Exemplo de máscara laríngea com balonete. Há diferentes gerações e modelos.",author:"ICUnurses",license:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0",source:"https://commons.wikimedia.org/wiki/File:LMA_Adult_size_4.JPG",src:supraglottic},
{id:"sensor",label:"Sensor de capnografia",description:"Sensor de CO₂ e adaptador separados. A curva é exibida no monitor conectado.",author:"Blogotron",license:"CC0",licenseUrl:"http://creativecommons.org/publicdomain/zero/1.0/deed.en",source:"https://commons.wikimedia.org/wiki/File:Capnometry_parts_apart.JPG",src:sensor}
] as const;
