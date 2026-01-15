import { MovieRecord } from './types';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

export const MOCK_DB: Partial<MovieRecord>[] = [
  { title: '星际穿越', originalTitle: 'Interstellar', type: 'Movie', year: 2014, doubanRating: 9.4, actors: ['马修·麦康纳', '安妮·海瑟薇'], director: '克里斯托弗·诺兰', tags: ['科幻', '剧情', '冒险'], duration: 169, episodes: 1, watchDate: '2023-11-15', coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=300' },
  { title: '绝命毒师', originalTitle: 'Breaking Bad', type: 'Series', season: 1, year: 2008, doubanRating: 9.8, actors: ['布莱恩·科兰斯顿', '亚伦·保尔'], director: '文斯·吉里根', tags: ['犯罪', '剧情'], duration: 45, episodes: 7, watchDate: '2023-10-01', coverUrl: 'https://images.unsplash.com/photo-1568819317551-31051b37f69f?auto=format&fit=crop&q=80&w=300' },
  { title: '绝命毒师', originalTitle: 'Breaking Bad', type: 'Series', season: 2, year: 2009, doubanRating: 9.9, actors: ['布莱恩·科兰斯顿', '亚伦·保尔'], director: '文斯·吉里根', tags: ['犯罪', '剧情'], duration: 47, episodes: 13, watchDate: '2023-10-15', coverUrl: 'https://images.unsplash.com/photo-1568819317551-31051b37f69f?auto=format&fit=crop&q=80&w=300' },
  { title: '千与千寻', originalTitle: '千と千尋の神隠し', type: 'Anime', year: 2001, doubanRating: 9.4, actors: ['柊瑠美', '入野自由'], director: '宫崎骏', tags: ['动画', '奇幻'], duration: 125, episodes: 1, watchDate: '2023-09-20', coverUrl: 'https://images.unsplash.com/photo-1560167016-022b78a0258e?auto=format&fit=crop&q=80&w=300' },
  { title: '地球脉动', originalTitle: 'Planet Earth', type: 'Documentary', season: 1, year: 2006, doubanRating: 9.9, actors: ['大卫·爱登堡'], director: '阿拉斯泰尔·福瑟吉尔', tags: ['纪录片', '自然'], duration: 60, episodes: 11, watchDate: '2023-08-15', coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300' },
];