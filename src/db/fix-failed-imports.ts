import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { searchPlace } from "../lib/google-places";

interface FailedPlace {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  city: string;
  ward: string | null;
  neighborhood?: string;
  googleMapsUrl: string;
  categories: string[];
}

const PLACES: FailedPlace[] = [
  {
    title: "Akimoto",
    description: "Restaurant in the Asakusa area of Tokyo",
    latitude: 35.7148,
    longitude: 139.7967,
    city: "Tokyo",
    ward: "Taito",
    googleMapsUrl:
      "https://www.google.com/maps/place/Akimoto/data=!4m2!3m1!1s0x601845c178fce0b3:0x6190464c9adddc50",
    categories: ["Restaurant"],
  },
  {
    title: "Loudia",
    description: "Restaurant in the Asakusa area of Tokyo",
    latitude: 35.7145,
    longitude: 139.796,
    city: "Tokyo",
    ward: "Taito",
    googleMapsUrl:
      "https://www.google.com/maps/place/Loudia/data=!4m2!3m1!1s0x601845a8ca0623e1:0xd9c98b195970197b",
    categories: ["Restaurant"],
  },
  {
    title: "Zeniba Seiniku",
    description:
      "Yakiniku restaurant specializing in A5 wagyu beef cooked on lava hot plates from Mt. Fuji",
    latitude: 35.626,
    longitude: 139.7234,
    city: "Tokyo",
    ward: "Shinagawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/ZenibaSeiniku/data=!4m2!3m1!1s0x60188a7c6d820d89:0xcc156bbd1770f966",
    categories: ["Yakiniku"],
  },
  {
    title: "Chokyoji",
    description: "Buddhist temple in Nishiasakusa, Taito",
    latitude: 35.7118,
    longitude: 139.7912,
    city: "Tokyo",
    ward: "Taito",
    googleMapsUrl:
      "https://www.google.com/maps/place/Chokyoji/data=!4m2!3m1!1s0x6002f043de841f53:0x7f6dcbe2cb9403f5",
    categories: ["Temple"],
  },
  {
    title: "Joto's Old Townhouses",
    description:
      "Historic preservation district of Edo-period merchant townhouses along the old Izumo Highway, east of Tsuyama Castle",
    latitude: 35.063,
    longitude: 134.0164,
    city: "Tsuyama",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Joto%E2%80%99s+old+townhouses/data=!4m2!3m1!1s0x35543135bb5d0b55:0xfa211e4aa9f8429b",
    categories: ["Landmark", "Viewpoint"],
  },
  {
    title: "Suppon",
    description:
      "Tsukemen (dipping ramen) specialty restaurant near Koiwa Station",
    latitude: 35.7328,
    longitude: 139.8801,
    city: "Tokyo",
    ward: "Edogawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/Suppon/data=!4m2!3m1!1s0x601885d885a0b68d:0xe8e807dc02ad3fae",
    categories: ["Ramen"],
  },
  {
    title: "Tomizawa",
    description: "Baking and confectionery ingredient retail store in Sapporo",
    latitude: 43.0687,
    longitude: 141.3508,
    city: "Sapporo",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Tomizawa/data=!4m2!3m1!1s0x5f88da84b3b6ecef:0x8a0c30e8d27c2a20",
    categories: ["Gift Shop"],
  },
  {
    title: "CotoCoto",
    description:
      "Casual Western-style restaurant (yoshoku) and izakaya near Chitosefunabashi Station, known for hamburger steak",
    latitude: 35.6503,
    longitude: 139.6277,
    city: "Tokyo",
    ward: "Setagaya",
    googleMapsUrl:
      "https://www.google.com/maps/place/CotoCoto/data=!4m2!3m1!1s0x354f8519e182f0b5:0xcafe5caad3034b39",
    categories: ["Restaurant"],
  },
  {
    title: "Seiseian",
    description:
      "Urasenke-school tea ceremony classroom in central Kyoto, offering tea ceremony experiences",
    latitude: 35.0054,
    longitude: 135.7577,
    city: "Kyoto",
    ward: "Nakagyo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Seiseian/data=!4m2!3m1!1s0x3544af7af9597c0d:0xbb9b4dd29a6bc01b",
    categories: ["Café"],
  },
  {
    title: "Byakushin",
    description:
      "Soba (buckwheat noodle) restaurant in Hanahata, Adachi, also serves pasta and omurice",
    latitude: 35.8011,
    longitude: 139.8195,
    city: "Tokyo",
    ward: "Adachi",
    googleMapsUrl:
      "https://www.google.com/maps/place/Byakushin/data=!4m2!3m1!1s0x601891339ac875a9:0x90b3963131e814b",
    categories: ["Japanese Restaurant"],
  },
  {
    title: "Komatsuya Shokudo",
    description:
      "Traditional Japanese set-meal restaurant in Choshi, known for seasonal seafood dishes",
    latitude: 35.7347,
    longitude: 140.8268,
    city: "Choshi",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/%E5%B0%8F%E6%9D%BE%E5%B1%8B%E9%A3%9F%E5%A0%82/data=!4m2!3m1!1s0x601d765303b54f89:0x64fb8406c11de793",
    categories: ["Japanese Restaurant"],
  },
  {
    title: "FamilyMart (Sumida)",
    description: "Convenience store in Sumida ward, Tokyo",
    latitude: 35.71,
    longitude: 139.814,
    city: "Tokyo",
    ward: "Sumida",
    googleMapsUrl:
      "https://www.google.com/maps/place/FamilyMart/data=!4m2!3m1!1s0x60188cdb5f110d8f:0x4941bdb90c46b6b7",
    categories: ["Convenience Store"],
  },
  {
    title: "Soho Park",
    description:
      "Public park on the former estate of journalist Tokutomi Soho, featuring bamboo groves and a pond",
    latitude: 35.604,
    longitude: 139.718,
    city: "Tokyo",
    ward: "Ota",
    googleMapsUrl:
      "https://www.google.com/maps/place/Soh%C5%8D+Park/data=!4m2!3m1!1s0x60186027eb14f9f7:0x903eaa4525cd1636",
    categories: ["Park", "Garden"],
  },
  {
    title: "Yoshizawa",
    description:
      "Michelin-starred Japanese restaurant (kaiseki/sukiyaki), established 1924",
    latitude: 35.672,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Yoshizawa/data=!4m2!3m1!1s0x60188bdf29aec43d:0x8c7da0a1e8179f03",
    categories: ["Japanese Restaurant"],
  },
  {
    title: "FamilyMart (Shibuya)",
    description: "Convenience store in Tokyo",
    latitude: 35.66,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/FamilyMart/data=!4m2!3m1!1s0x60188c8bb31bffff:0x2371f03faface3b0",
    categories: ["Convenience Store"],
  },
  {
    title: "Courage",
    description:
      "Modern French restaurant in Azabu-Juban that transforms into a wine bar after 9 PM, Michelin-listed",
    latitude: 35.654,
    longitude: 139.737,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Courage/data=!4m2!3m1!1s0x60188ec0a6117f9d:0xf7f70c091e84fa2",
    categories: ["Western Restaurant", "Bar"],
  },
  {
    title: "Kirara",
    description: "Izakaya (Japanese-style pub) near Shizuoka Station",
    latitude: 34.972,
    longitude: 138.389,
    city: "Shizuoka",
    ward: "Suruga",
    googleMapsUrl:
      "https://www.google.com/maps/place/Kirara/data=!4m2!3m1!1s0x6000aeccca16f215:0x9a521b8a6acae5d4",
    categories: ["Izakaya"],
  },
  {
    title: "Manjuu",
    description:
      "Traditional Japanese manju (steamed sweet bun) shop in Yamanashi Prefecture",
    latitude: 35.37,
    longitude: 138.44,
    city: "Minobu",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/%E3%83%9E%E3%83%B3%E3%82%B8%E3%83%A5%E3%82%A6/data=!4m2!3m1!1s0x6006250068089723:0x4991a6880957179e",
    categories: ["Dessert"],
  },
  {
    title: "Aoyama",
    description:
      "Upscale neighborhood in Minato known for fashion, dining, Nezu Museum, and the Prada building",
    latitude: 35.665,
    longitude: 139.714,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%90%D0%BE%D1%98%D0%B0%D0%BC%D0%B0/data=!4m2!3m1!1s0x60188b62ca6eed21:0x880e44263ab0931a",
    categories: ["Landmark", "Neighborhood"],
  },
  {
    title: "Meio-in",
    description: "Buddhist temple (Shingon sect) in Tokyo",
    latitude: 35.652,
    longitude: 139.739,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Mei%C5%8D-in/data=!4m2!3m1!1s0x60188baefbab887d:0x357e463349dfa88d",
    categories: ["Temple"],
  },
  {
    title: "Mita Canal Branch Intake",
    description:
      "Historical Edo-era agricultural water canal intake point, part of the Tamagawa Aqueduct system",
    latitude: 35.668,
    longitude: 139.668,
    city: "Tokyo",
    ward: "Setagaya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Mita+Canal+Branch+Intake/data=!4m2!3m1!1s0x6018f31650700529:0x95082d8970ee036",
    categories: ["Landmark"],
  },
  {
    title: "Huckleberry",
    description: "Cafe in Tsurui Village, Hokkaido",
    latitude: 43.23,
    longitude: 144.32,
    city: "Tsurui",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Huckleberry/data=!4m2!3m1!1s0x5f8f4482acdc0765:0x40d14ad2abf308b5",
    categories: ["Café"],
  },
  {
    title: "Ikkaku",
    description: "Udon restaurant in Tokyo, known for Sanuki-style udon",
    latitude: 35.6938,
    longitude: 139.7055,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Ikkaku/data=!4m2!3m1!1s0x60188bee30c0d4b9:0xc4b46e45ef06d6b7",
    categories: ["Restaurant"],
  },
  {
    title: "Kitchen Origin",
    description: "Bento and prepared food takeout chain store in Tokyo",
    latitude: 35.6312,
    longitude: 139.7148,
    city: "Tokyo",
    ward: "Shinagawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/Kitchen+Origin/data=!4m2!3m1!1s0x60188eb79587a035:0xdd7979292476b675",
    categories: ["Restaurant"],
  },
  {
    title: "Daita Fuji 356 Plaza",
    description: "Small commercial plaza near Shimokitazawa in Setagaya",
    latitude: 35.6597,
    longitude: 139.6656,
    city: "Tokyo",
    ward: "Setagaya",
    neighborhood: "Daita",
    googleMapsUrl:
      "https://www.google.com/maps/place/Daita+Fuji+356+Plaza/data=!4m2!3m1!1s0x6018f37230cbd0e5:0x401b18b0cf57e256",
    categories: ["Shopping Mall"],
  },
  {
    title: "Zennenji",
    description: "Buddhist temple in Hokkaido",
    latitude: 43.3356,
    longitude: 145.5857,
    city: "Shibecha",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Zennenji/data=!4m2!3m1!1s0x5ff7769e8b9e275b:0x50bdc5c9724f7b50",
    categories: ["Temple"],
  },
  {
    title: "NewDays (Ryogoku)",
    description: "JR East convenience store at Ryogoku Station",
    latitude: 35.6962,
    longitude: 139.7935,
    city: "Tokyo",
    ward: "Sumida",
    googleMapsUrl:
      "https://www.google.com/maps/place/NewDays/data=!4m2!3m1!1s0x60188bfb9104ed2f:0x5737401f1535202",
    categories: ["Convenience Store"],
  },
  {
    title: "Kichijoji Village Origin Sign",
    description:
      "Historical explanation board about the origins of Kichijoji village",
    latitude: 35.7032,
    longitude: 139.5795,
    city: "Tokyo",
    ward: "Musashino",
    neighborhood: "Kichijoji",
    googleMapsUrl:
      "https://www.google.com/maps/place/%E3%80%8C%E5%90%89%E7%A5%A5%E5%AF%BA%E6%9D%91%E3%81%AE%E3%81%AF%E3%81%98%E3%81%BE%E3%82%8A%E3%80%8D%E8%AA%AC%E6%98%8E%E6%9D%BF/data=!4m2!3m1!1s0x6018efc62a8d136d:0xb73df3e519b4e438",
    categories: ["Landmark"],
  },
  {
    title: "Furin",
    description:
      "Cozy standing bar (tachinomi) in front of Gotokuji Station, known for hoppy and creative highball drinks",
    latitude: 35.654,
    longitude: 139.6472,
    city: "Tokyo",
    ward: "Setagaya",
    neighborhood: "Gotokuji",
    googleMapsUrl:
      "https://www.google.com/maps/place/furin/data=!4m2!3m1!1s0x6018da60d19b00cd:0x6e7f2717b8f55905",
    categories: ["Bar"],
  },
  // --- Places incorrectly removed as non-Japan by AI ---
  {
    title: "Komichi",
    description: "Cafe in the Nezu/Yanaka area",
    latitude: 35.726,
    longitude: 139.767,
    city: "Tokyo",
    ward: "Bunkyo",
    neighborhood: "Nezu",
    googleMapsUrl:
      "https://www.google.com/maps/place/Komichi/data=!4m2!3m1!1s0x60188d88426bd23b:0xd4367960f2344c07",
    categories: ["Café"],
  },
  {
    title: "Pelican",
    description: "Legendary bakery since 1942, famous for shokupan and rolls",
    latitude: 35.712,
    longitude: 139.794,
    city: "Tokyo",
    ward: "Taito",
    neighborhood: "Asakusa",
    googleMapsUrl:
      "https://www.google.com/maps/place/Pelican/data=!4m2!3m1!1s0x60188eb8e8bbc2e5:0xc868b7ab42649c91",
    categories: ["Bakery"],
  },
  {
    title: "Ikoi.",
    description: "Cafe in eastern Tokyo",
    latitude: 35.729,
    longitude: 139.828,
    city: "Tokyo",
    ward: "Sumida",
    googleMapsUrl:
      "https://www.google.com/maps/place/Ikoi./data=!4m2!3m1!1s0x60188f99b4b07d9d:0x4018a2de98cb6de",
    categories: ["Café"],
  },
  {
    title: "Ikoi cafe",
    description: "Cafe in Nerima",
    latitude: 35.756,
    longitude: 139.69,
    city: "Tokyo",
    ward: "Nerima",
    googleMapsUrl:
      "https://www.google.com/maps/place/Ikoi+cafe/data=!4m2!3m1!1s0x6018978a8c5959f7:0x317771d15f32cabe",
    categories: ["Café"],
  },
  {
    title: "Delrey",
    description: "Belgian luxury chocolate and patisserie in Ginza",
    latitude: 35.671,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Chuo",
    neighborhood: "Ginza",
    googleMapsUrl:
      "https://www.google.com/maps/place/Delrey/data=!4m2!3m1!1s0x60188be6f5d7cc35:0x19bd95b76733a14f",
    categories: ["Chocolate Shop", "Dessert"],
  },
  {
    title: "Grigio",
    description: "Italian restaurant in Shimbashi area",
    latitude: 35.662,
    longitude: 139.755,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Grigio/data=!4m2!3m1!1s0x60188b44f9235f77:0x9d260a7f6bb087bd",
    categories: ["Italian Restaurant"],
  },
  {
    title: "Oden",
    description: "Oden restaurant in Sangenjaya",
    latitude: 35.644,
    longitude: 139.668,
    city: "Tokyo",
    ward: "Setagaya",
    neighborhood: "Sangenjaya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Oden/data=!4m2!3m1!1s0x6018f50077360439:0xefd18e71660a4815",
    categories: ["Japanese Restaurant"],
  },
  {
    title: "Setagaya Park",
    description: "Public park in Setagaya ward",
    latitude: 35.65,
    longitude: 139.66,
    city: "Tokyo",
    ward: "Setagaya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Setagaya+Park/data=!4m2!3m1!1s0x6018f362681cd361:0x65b4368423c4c4a8",
    categories: ["Park"],
  },
  {
    title: "Suzuran",
    description: "Restaurant/shop near Shimokitazawa",
    latitude: 35.66,
    longitude: 139.653,
    city: "Tokyo",
    ward: "Setagaya",
    neighborhood: "Shimokitazawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/Suzuran/data=!4m2!3m1!1s0x6018ed1e6005b149:0xd70a7ba072600e03",
    categories: ["Restaurant"],
  },
  {
    title: "reload",
    description:
      "Modern commercial complex with cafes and shops in Shimokitazawa",
    latitude: 35.661,
    longitude: 139.667,
    city: "Tokyo",
    ward: "Setagaya",
    neighborhood: "Shimokitazawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/reload/data=!4m2!3m1!1s0x6018f317d062381f:0x657e64bf0f831da2",
    categories: ["Shopping Mall", "Café"],
  },
  {
    title: "Crkva Vaskrsenja Hristovog",
    description:
      "Orthodox church in central Tokyo (Holy Resurrection Cathedral)",
    latitude: 35.7,
    longitude: 139.768,
    city: "Tokyo",
    ward: "Chiyoda",
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A6%D1%80%D0%BA%D0%B2%D0%B0+%D0%92%D0%B0%D1%81%D0%BA%D1%80%D1%81%D0%B5%D1%9A%D0%B0+%D0%A5%D1%80%D0%B8%D1%81%D1%82%D0%BE%D0%B2%D0%BE%D0%B3/data=!4m2!3m1!1s0x60188c1bb3debbcd:0x62fb3d110ddc45b6",
    categories: ["Landmark"],
  },
  {
    title: "Airship Coffee",
    description: "Specialty coffee shop in Onomichi, Hiroshima Prefecture",
    latitude: 34.409,
    longitude: 133.202,
    city: "Onomichi",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Airship+Coffee/data=!4m2!3m1!1s0x35510195f25cbb1b:0x91b71ae122ad8088",
    categories: ["Café"],
  },
  {
    title: "Honcho Park",
    description: "Public park in Chiba City",
    latitude: 35.613,
    longitude: 140.113,
    city: "Chiba",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Honcho+Park/data=!4m2!3m1!1s0x60229b337edf3a4d:0x66933207788b9612",
    categories: ["Park"],
  },
  {
    title: "STAR CLUB",
    description: "Bar/club in Shibuya",
    latitude: 35.661,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/STAR+CLUB/data=!4m2!3m1!1s0x60188cdc825d3389:0xa4d9edd2a2fc9e7",
    categories: ["Bar"],
  },
  {
    title: "Mariya",
    description: "Restaurant in Kichijoji",
    latitude: 35.703,
    longitude: 139.579,
    city: "Tokyo",
    ward: "Musashino",
    neighborhood: "Kichijoji",
    googleMapsUrl:
      "https://www.google.com/maps/place/Mariya/data=!4m2!3m1!1s0x6018ee477603a6df:0x5a1e9a95222d823e",
    categories: ["Restaurant"],
  },
  {
    title: "PATIO",
    description: "Cafe/restaurant in Kichijoji",
    latitude: 35.703,
    longitude: 139.58,
    city: "Tokyo",
    ward: "Musashino",
    neighborhood: "Kichijoji",
    googleMapsUrl:
      "https://www.google.com/maps/place/PATIO/data=!4m2!3m1!1s0x6018ef007c2437f9:0xab77819665d58994",
    categories: ["Café"],
  },
  {
    title: "PIZZA SLICE",
    description: "New York-style pizza by the slice in Nishi-Azabu",
    latitude: 35.66,
    longitude: 139.729,
    city: "Tokyo",
    ward: "Minato",
    neighborhood: "Nishi-Azabu",
    googleMapsUrl:
      "https://www.google.com/maps/place/PIZZA+SLICE/data=!4m2!3m1!1s0x60188b5b150ddc43:0x6774f31fd3f468c1",
    categories: ["Pizza"],
  },
  {
    title: "Baja",
    description: "Mexican restaurant/bar in Nishi-Azabu",
    latitude: 35.66,
    longitude: 139.726,
    city: "Tokyo",
    ward: "Minato",
    neighborhood: "Nishi-Azabu",
    googleMapsUrl:
      "https://www.google.com/maps/place/Baja/data=!4m2!3m1!1s0x60188b4eeaf9b8f1:0xf8456596950dc5bb",
    categories: ["Restaurant", "Bar"],
  },
  {
    title: "St. Paul's House",
    description: "Building/landmark near Shinjuku",
    latitude: 35.694,
    longitude: 139.707,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/St.+Paul's+House/data=!4m2!3m1!1s0x60188d576325f481:0x993568c805c6fa4b",
    categories: ["Landmark"],
  },
  {
    title: "Chicken Nara",
    description: "Chicken restaurant in eastern Tokyo",
    latitude: 35.741,
    longitude: 139.864,
    city: "Tokyo",
    ward: "Edogawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/Chicken+Nara/data=!4m2!3m1!1s0x601885ec80811719:0xfecbd3df3f0b8206",
    categories: ["Restaurant"],
  },
  {
    title: "Gin Sushi",
    description: "Sushi restaurant in Hokkaido",
    latitude: 43.055,
    longitude: 141.34,
    city: "Sapporo",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Gin+Sushi/data=!4m2!3m1!1s0x5ff3658b6a0ca195:0x95f4493263ae8c30",
    categories: ["Sushi"],
  },
  {
    title: "Hananoki",
    description: "Restaurant/cafe in eastern Hokkaido",
    latitude: 43.34,
    longitude: 144.38,
    city: "Teshikaga",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Hananoki/data=!4m2!3m1!1s0x5ff487565194b4f5:0x7f8ee71e0011f50c",
    categories: ["Restaurant"],
  },
  {
    title: "Nomad",
    description: "Cafe/bar in western Japan",
    latitude: 34.07,
    longitude: 134.55,
    city: "Tokushima",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Nomad/data=!4m2!3m1!1s0x355b2f08eb18f043:0x99cf934d34eb4c2e",
    categories: ["Café"],
  },
  {
    title: "Tama Lake",
    description:
      "Scenic reservoir (Murayama Reservoir) in western Tokyo, inspiration for Totoro's forest",
    latitude: 35.759,
    longitude: 139.392,
    city: "Higashimurayama",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Tama+Lake/data=!4m2!3m1!1s0x6018e0b1a27e5da3:0x89699f80c5bc19d4",
    categories: ["Park", "Viewpoint"],
  },
  {
    title: "Sukiya",
    description: "Gyudon (beef bowl) chain restaurant in Shinjuku",
    latitude: 35.688,
    longitude: 139.699,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/Sukiya/data=!4m2!3m1!1s0x60188cdec6c7a86b:0xbc6487462876cfc2",
    categories: ["Donburi"],
  },
  {
    title: "Yoshinoya",
    description: "Iconic gyudon chain restaurant, founded 1899",
    latitude: 35.662,
    longitude: 139.704,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Yoshinoya/data=!4m2!3m1!1s0x60188dadda8d09d1:0x327e49433a9884c6",
    categories: ["Donburi"],
  },
  {
    title: "Harry Potter Studio Bicycle",
    description: "Bicycle parking/rental near Warner Bros. Studio Tour Tokyo",
    latitude: 35.743,
    longitude: 139.631,
    city: "Tokyo",
    ward: "Nerima",
    googleMapsUrl:
      "https://www.google.com/maps/place/Harry+Potter+Studio+Bicycle/data=!4m2!3m1!1s0x6018ed00620acb9f:0x8d93ce54e5bd0943",
    categories: ["Landmark"],
  },
  {
    title: "Manse Park",
    description: "Public park in Adachi ward",
    latitude: 35.775,
    longitude: 139.835,
    city: "Tokyo",
    ward: "Adachi",
    googleMapsUrl:
      "https://www.google.com/maps/place/Manse+Park/data=!4m2!3m1!1s0x6018877d19c5cc01:0xe8473583a73c0f21",
    categories: ["Park"],
  },
  {
    title: "Unagi Shokudo",
    description: "Eel (unagi) restaurant in central Tokyo",
    latitude: 35.672,
    longitude: 139.768,
    city: "Tokyo",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Unagi+Shokudo/data=!4m2!3m1!1s0x60188bdf2f88d74d:0xce59baa2e7a3edb",
    categories: ["Japanese Restaurant"],
  },
  {
    title: "Le Pain",
    description: "French-style bakery in central Tokyo",
    latitude: 35.672,
    longitude: 139.767,
    city: "Tokyo",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Le+Pain/data=!4m2!3m1!1s0x60188bded52f860f:0xc4b9756612f8b99",
    categories: ["Bakery"],
  },
  {
    title: "Flower Field",
    description: "Flower shop in Nishi-Azabu",
    latitude: 35.66,
    longitude: 139.726,
    city: "Tokyo",
    ward: "Minato",
    neighborhood: "Nishi-Azabu",
    googleMapsUrl:
      "https://www.google.com/maps/place/Flower+Field/data=!4m2!3m1!1s0x60188b4ad32dce05:0xef238724d5639e64",
    categories: ["Gift Shop"],
  },
  {
    title: "Mister Donut",
    description: "Popular Japanese donut chain",
    latitude: 35.694,
    longitude: 139.701,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/Mister+Donut/data=!4m2!3m1!1s0x60188d5d001c0a8b:0x3181d092438ef0e0",
    categories: ["Dessert"],
  },
  {
    title: "Takeda",
    description: "Restaurant in Shinjuku area",
    latitude: 35.694,
    longitude: 139.701,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/Takeda/data=!4m2!3m1!1s0x60188d7c152c2f6d:0x734784d3c002ce45",
    categories: ["Restaurant"],
  },
  {
    title: "Shabu-Yo",
    description: "All-you-can-eat shabu-shabu buffet chain",
    latitude: 35.66,
    longitude: 139.729,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Shabu-Yo/data=!4m2!3m1!1s0x60188b57df73845b:0xbed524667f073c1c",
    categories: ["Shabu-shabu"],
  },
  {
    title: "Giolitti",
    description: "Italian gelateria, NEWoMaN Shinjuku branch",
    latitude: 35.688,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shinjuku",
    neighborhood: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/Giolitti/data=!4m2!3m1!1s0x60188d004349b829:0xf9a34c81f5df9a1e",
    categories: ["Ice Cream Shop"],
  },
  {
    title: "Platinumya",
    description: "Shop in Chuo ward",
    latitude: 35.671,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Platinumya/data=!4m2!3m1!1s0x60188be0bbb9b3e5:0x794f7d86c4ac622c",
    categories: ["Gift Shop"],
  },
  {
    title: "Kanadaya",
    description: "Famous tonkotsu ramen, originally from Fukuoka",
    latitude: 35.66,
    longitude: 139.698,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Kanadaya/data=!4m2!3m1!1s0x60188bbcecad5b3d:0xe4b8e3797d928aea",
    categories: ["Ramen"],
  },
  {
    title: "ART AQUARIUM MUSEUM",
    description: "Immersive art museum with goldfish displays in Ginza",
    latitude: 35.686,
    longitude: 139.782,
    city: "Tokyo",
    ward: "Chuo",
    neighborhood: "Nihonbashi",
    googleMapsUrl:
      "https://www.google.com/maps/place/ART+AQUARIUM+MUSEUM/data=!4m2!3m1!1s0x6018895d1e5245e9:0xd9bdf0c3acccea0e",
    categories: ["Museum"],
  },
  {
    title: "Sanrio Gift Gate (Ginza)",
    description: "Sanrio character goods store",
    latitude: 35.671,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Chuo",
    neighborhood: "Ginza",
    googleMapsUrl:
      "https://www.google.com/maps/place/Sanrio+Gift+Gate/data=!4m2!3m1!1s0x60188be5996b97ff:0x11b3e2babce4f1c8",
    categories: ["Gift Shop"],
  },
  {
    title: "Park View Garden",
    description: "Restaurant/garden in Shibuya area",
    latitude: 35.663,
    longitude: 139.698,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Park+View+Garden/data=!4m2!3m1!1s0x60188bee25b1e89d:0xf563666dc9f37b7d",
    categories: ["Restaurant"],
  },
  {
    title: "My Basket",
    description: "AEON small-format supermarket",
    latitude: 35.695,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/My+Basket/data=!4m2!3m1!1s0x60188c8ca929ba27:0xdbaf02b9694a871c",
    categories: ["Convenience Store"],
  },
  {
    title: "Bar Hameln",
    description: "Cocktail bar in Shinjuku area",
    latitude: 35.695,
    longitude: 139.705,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/Bar+Hameln/data=!4m2!3m1!1s0x60188d957e7c883b:0xdeb2702bf5384cc0",
    categories: ["Bar"],
  },
  {
    title: "Isuzu",
    description: "Tea house/restaurant in Shinjuku area",
    latitude: 35.694,
    longitude: 139.701,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/%E4%BA%94%E5%8D%81%E9%88%B4/data=!4m2!3m1!1s0x60188d352e7bc337:0xd297b124d03bbf87",
    categories: ["Café"],
  },
  {
    title: "Flags",
    description: "Shopping building at Shinjuku Station south exit",
    latitude: 35.689,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shinjuku",
    neighborhood: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/Flags/data=!4m2!3m1!1s0x60188cda7fd27c7b:0xf40345fb44143697",
    categories: ["Shopping Mall"],
  },
  {
    title: "KUZE FUKU & Co.",
    description: "Artisanal Japanese food and jam specialty store",
    latitude: 35.729,
    longitude: 139.828,
    city: "Tokyo",
    ward: "Sumida",
    googleMapsUrl:
      "https://www.google.com/maps/place/KUZE+FUKU+%26+Co./data=!4m2!3m1!1s0x60188f9af88891d1:0xaf1cd1e9c5be3e21",
    categories: ["Gift Shop"],
  },
  {
    title: "Beard Papa's",
    description: "Japanese cream puff chain, founded in Osaka",
    latitude: 35.672,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Beard+Papa%E2%80%99s/data=!4m2!3m1!1s0x60188ea7e4867841:0x3a36ec90af0c5136",
    categories: ["Dessert"],
  },
  {
    title: "Takioka",
    description: "Tapioca/bubble tea drink shop",
    latitude: 35.672,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Takioka/data=!4m2!3m1!1s0x60188e9faafb4bed:0x94718b8324a18b07",
    categories: ["Café"],
  },
  {
    title: "Green Park Promenade",
    description: "Walking path/park near Kichijoji",
    latitude: 35.703,
    longitude: 139.579,
    city: "Tokyo",
    ward: "Musashino",
    neighborhood: "Kichijoji",
    googleMapsUrl:
      "https://www.google.com/maps/place/Green+Park+Promenade/data=!4m2!3m1!1s0x6018ef094a3a7d9b:0xf28d16c6bcc0f639",
    categories: ["Park"],
  },
  {
    title: "LOST",
    description: "Bar in Shinjuku area",
    latitude: 35.688,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/LOST/data=!4m2!3m1!1s0x60188d006156b587:0x580fcf1da447ae0",
    categories: ["Bar"],
  },
  {
    title: "O-GUARD",
    description: "Commercial building near Shinjuku",
    latitude: 35.688,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shinjuku",
    googleMapsUrl:
      "https://www.google.com/maps/place/O-GUARD/data=!4m2!3m1!1s0x60188d0056d4de4d:0xe50131e064d9aa7c",
    categories: ["Shopping Mall"],
  },
  {
    title: "Philosopher's Walk",
    description: "Walking path in western Tokyo",
    latitude: 35.728,
    longitude: 139.498,
    city: "Tokyo",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/%E5%93%B2%E5%AD%A6%E8%80%85%E3%81%AE%E9%81%93/data=!4m2!3m1!1s0x6018e6b9e4828d51:0x8a68ba9e96665e30",
    categories: ["Park", "Neighborhood"],
  },
  {
    title: "Not Suspicious",
    description: "Bar in eastern Tokyo",
    latitude: 35.729,
    longitude: 139.828,
    city: "Tokyo",
    ward: "Sumida",
    googleMapsUrl:
      "https://www.google.com/maps/place/Not+Suspicious/data=!4m2!3m1!1s0x60188fd5d6af6391:0x74e1f4afe68b9ce9",
    categories: ["Bar"],
  },
  {
    title: "Kozan",
    description: "Restaurant near Shizuoka",
    latitude: 34.972,
    longitude: 138.389,
    city: "Shizuoka",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Kozan/data=!4m2!3m1!1s0x6000af8eed4d14bb:0x8b54158fa9f4ab2f",
    categories: ["Restaurant"],
  },
  {
    title: "Plaza",
    description: "Shopping plaza in Minato ward",
    latitude: 35.66,
    longitude: 139.729,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Plaza/data=!4m2!3m1!1s0x60188b004656c177:0x8af336ade16baeaa",
    categories: ["Shopping Mall"],
  },
  {
    title: "Burger Mania",
    description: "Gourmet burger restaurant",
    latitude: 35.66,
    longitude: 139.729,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Burger+Mania/data=!4m2!3m1!1s0x60188b1399c0a2f9:0x7536a3cabb5f007",
    categories: ["Restaurant"],
  },
  {
    title: "DAY COFFEE",
    description: "Coffee shop in Chuo ward",
    latitude: 35.671,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/DAY+COFFEE/data=!4m2!3m1!1s0x60188bf5737cd495:0xc3b4e776f3a2b05b",
    categories: ["Café"],
  },
  {
    title: "Tonsei",
    description: "Restaurant in southern Tokyo",
    latitude: 35.604,
    longitude: 139.718,
    city: "Tokyo",
    ward: "Ota",
    googleMapsUrl:
      "https://www.google.com/maps/place/Tonsei/data=!4m2!3m1!1s0x60185fa46c6454f7:0x2ac2068b84c7f402",
    categories: ["Restaurant"],
  },
  {
    title: "Manga and Coffee",
    description: "Manga cafe in Shimokitazawa",
    latitude: 35.661,
    longitude: 139.667,
    city: "Tokyo",
    ward: "Setagaya",
    neighborhood: "Shimokitazawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/Manga+and+Coffee/data=!4m2!3m1!1s0x6018f31907df91b1:0x7b97a38d229dc978",
    categories: ["Café"],
  },
  {
    title: "Koishikawa Botanical Garden",
    description: "Historic botanical garden run by University of Tokyo",
    latitude: 35.722,
    longitude: 139.739,
    city: "Tokyo",
    ward: "Bunkyo",
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%91%D0%BE%D1%82%D0%B0%D0%BD%D0%B8%D1%87%D0%BA%D0%B0+%D0%B1%D0%B0%D1%88%D1%82%D0%B0+%D0%9A%D0%BE%D0%B8%D1%88%D0%B8%D0%BA%D0%B0%D0%B2%D0%B0/data=!4m2!3m1!1s0x60188db3e92ec1bb:0xb8d81a9078dce5c5",
    categories: ["Park", "Garden"],
  },
  {
    title: "Ogawa",
    description: "Restaurant in central Tokyo",
    latitude: 35.686,
    longitude: 139.782,
    city: "Tokyo",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Ogawa/data=!4m2!3m1!1s0x60188951f14d924b:0xd2c491eedbe94ecf",
    categories: ["Restaurant"],
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  console.log(
    `=== Fix Failed Imports: inserting ${PLACES.length} places ===\n`,
  );

  // Build category name -> id map
  const allCategories = await db.select().from(schema.categories);
  const catMap = new Map<string, number>();
  for (const c of allCategories) {
    catMap.set(c.name, c.id);
  }

  let inserted = 0;
  let skipped = 0;
  let enriched = 0;

  for (const place of PLACES) {
    // Check if already exists by googleMapsUrl
    const existing = await db.query.places.findFirst({
      where: eq(schema.places.googleMapsUrl, place.googleMapsUrl),
    });
    if (existing) {
      // Still link categories for previously inserted places that may be missing them
      for (const catName of place.categories) {
        const catId = catMap.get(catName);
        if (catId) {
          await db
            .insert(schema.placeCategories)
            .values({ placeId: existing.id, categoryId: catId })
            .onConflictDoNothing();
        }
      }
      console.log(`  SKIP (exists, categories linked): ${place.title}`);
      skipped++;
      continue;
    }

    const [newPlace] = await db
      .insert(schema.places)
      .values({
        title: place.title,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        city: place.city,
        ward: place.ward,
        neighborhood: place.neighborhood ?? null,
        googleMapsUrl: place.googleMapsUrl,
        source: "csv_import",
        visited: false,
      })
      .returning();

    // Search Google Places to get the Place ID and accurate data
    try {
      const result = await searchPlace(place.title);
      if (result?.id && result.location) {
        await db
          .update(schema.places)
          .set({
            googlePlaceId: result.id,
            address: result.formattedAddress || null,
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            googleMapsUrl: place.googleMapsUrl || result.googleMapsUri || null,
            googlePhotoRef: result.photos?.[0]?.name || null,
            googlePhotoRefs: result.photos?.map((p) => p.name) || null,
            openingHours: result.regularOpeningHours?.periods
              ? {
                  periods: result.regularOpeningHours.periods,
                  weekdayDescriptions:
                    result.regularOpeningHours.weekdayDescriptions ?? [],
                }
              : null,
            businessStatus: result.businessStatus || null,
            googleRating: result.rating ?? null,
            googleReviewCount: result.userRatingCount ?? null,
          })
          .where(eq(schema.places.id, newPlace.id));
        enriched++;
      }
      await sleep(120);
    } catch (err) {
      console.warn(`  Could not enrich "${place.title}" from Google Places`);
    }

    // Link categories
    for (const catName of place.categories) {
      const catId = catMap.get(catName);
      if (catId) {
        await db
          .insert(schema.placeCategories)
          .values({ placeId: newPlace.id, categoryId: catId })
          .onConflictDoNothing();
      } else {
        console.log(
          `  WARNING: category "${catName}" not found for ${place.title}`,
        );
      }
    }

    console.log(`  OK: ${place.title} (${place.categories.join(", ")})`);
    inserted++;
  }

  console.log(
    `\nDone! Inserted: ${inserted}, Skipped: ${skipped}, Enriched from Google: ${enriched}`,
  );
  await pool.end();
}

main().catch(console.error);
