// data/albums.ts - 照片墙相册配置
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "magical-girl",
    title: "魔法少女的结界",
    description: "五种颜色，五段不愿醒来的梦",
    cover: "/img/gallery_img1.jpg",
    date: "2026.09",
    photos: [
      { url: "/img/gallery_img1.jpg", caption: "粉色缎带与光之杖" },
      { url: "/img/gallery_img2.jpg", caption: "紫色结界中的回眸" },
      { url: "/img/gallery_img3.jpg", caption: "金色缎带与礼炮" },
      { url: "/img/gallery_img4.jpg", caption: "蓝色剑阵" },
      { url: "/img/gallery_img5.jpg", caption: "锁链与尖塔之影" }
    ]
  },
  {
    id: "night-drift",
    title: "夜色漂流",
    description: "灯笼、锦鲤与深蓝的夜",
    cover: "/img/dusays-69c26fe4acdb5.jpg",
    date: "2026.08",
    photos: [
      { url: "/img/dusays-69c26fe4acdb5.jpg", caption: "夜桥灯影" },
      { url: "/img/dusays-69c26fe4d9486.jpg", caption: "水中锦鲤" },
      { url: "/img/dusays-69eae1f8589c8.jpg", caption: "深海中的蓝光" },
      { url: "/img/dusays-69ead0d347f8a.jpg", caption: "红与黑的窗边" }
    ]
  },
  {
    id: "warm-light",
    title: "暖光日常",
    description: "午后、窗边，与被照亮的瞬间",
    cover: "/img/dusays-69eb2a5a6e185.jpg",
    date: "2026.07",
    photos: [
      { url: "/img/dusays-69eb2a5a6e185.jpg", caption: "粉色房间" },
      { url: "/img/dusays-69eaccb49631a.jpg", caption: "秋日暖光" },
      { url: "/img/dusays-69eb051552fc5.jpg", caption: "狐耳与白" },
      { url: "/img/dusays-69eda7f6b9269.jpg", caption: "制服与红缎带" }
    ]
  }
];
