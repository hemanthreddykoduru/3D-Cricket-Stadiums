export interface StadiumAsset {
  slug: string;
  stadiumModel: string;
  environmentModel: string;
  status: 'available' | 'pending';
}

export const STADIUM_ASSETS: Record<string, StadiumAsset> = {
  'narendra-modi-stadium': {
    slug: 'narendra-modi-stadium',
    stadiumModel: '/models/narendra-modi-stadium/stadium.glb',
    environmentModel: '/models/narendra-modi-stadium/environment.glb',
    status: 'pending'
  },
  'wankhede-stadium': {
    slug: 'wankhede-stadium',
    stadiumModel: '/models/wankhede-stadium/stadium.glb',
    environmentModel: '/models/wankhede-stadium/environment.glb',
    status: 'pending'
  },
  'm-chinnaswamy-stadium': {
    slug: 'm-chinnaswamy-stadium',
    stadiumModel: '/models/m-chinnaswamy-stadium/stadium.glb',
    environmentModel: '/models/m-chinnaswamy-stadium/environment.glb',
    status: 'pending'
  },
  'eden-gardens': {
    slug: 'eden-gardens',
    stadiumModel: '/models/eden-gardens/stadium.glb',
    environmentModel: '/models/eden-gardens/environment.glb',
    status: 'pending'
  },
  'ma-chidambaram-stadium': {
    slug: 'ma-chidambaram-stadium',
    stadiumModel: '/models/ma-chidambaram-stadium/stadium.glb',
    environmentModel: '/models/ma-chidambaram-stadium/environment.glb',
    status: 'pending'
  },
  'rajiv-gandhi-international-cricket-stadium': {
    slug: 'rajiv-gandhi-international-cricket-stadium',
    stadiumModel: '/models/rajiv-gandhi-international-cricket-stadium/stadium.glb',
    environmentModel: '/models/rajiv-gandhi-international-cricket-stadium/environment.glb',
    status: 'pending'
  },
  'arun-jaitley-stadium': {
    slug: 'arun-jaitley-stadium',
    stadiumModel: '/models/arun-jaitley-stadium/stadium.glb',
    environmentModel: '/models/arun-jaitley-stadium/environment.glb',
    status: 'pending'
  },
  'ekana-cricket-stadium': {
    slug: 'ekana-cricket-stadium',
    stadiumModel: '/models/ekana-cricket-stadium/stadium.glb',
    environmentModel: '/models/ekana-cricket-stadium/environment.glb',
    status: 'pending'
  },
  'mca-stadium': {
    slug: 'mca-stadium',
    stadiumModel: '/models/mca-stadium/stadium.glb',
    environmentModel: '/models/mca-stadium/environment.glb',
    status: 'pending'
  },
  'sawai-mansingh-stadium': {
    slug: 'sawai-mansingh-stadium',
    stadiumModel: '/models/sawai-mansingh-stadium/stadium.glb',
    environmentModel: '/models/sawai-mansingh-stadium/environment.glb',
    status: 'pending'
  }
};
