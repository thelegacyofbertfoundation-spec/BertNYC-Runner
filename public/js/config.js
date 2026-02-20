// =============================================
// BERT RUNNER NYC - Config (Three.js)
// =============================================
const CONFIG = {
  MAX_ENERGY: 5,
  ENERGY_REGEN_MS: 20 * 60 * 1000,

  INITIAL_SPEED: 0.15,
  MAX_SPEED: 0.6,
  SPEED_INCREMENT: 0.000025,

  GRAVITY: 0.008,
  JUMP_FORCE: 0.18,

  LANE_WIDTH: 2.5,        // X distance between lanes
  PLAYER_Z: 0,            // Player stays at Z=0
  SPAWN_Z: -120,          // Obstacles spawn far away
  DESPAWN_Z: 10,           // Remove after passing camera
  ROAD_LENGTH: 160,
  ROAD_WIDTH: 9,
  SIDEWALK_WIDTH: 3,

  OBSTACLE_MIN_GAP: 18,
  OBSTACLE_MAX_GAP: 40,
  COIN_GROUP_SIZE: 5,
  COIN_GAP: 3,

  OBSTACLES: [
    { type:'taxi', w:1.8, h:1.2, d:4.0, jumpable:false },
    { type:'taxi', w:1.8, h:1.2, d:4.0, jumpable:false },
    { type:'taxi', w:1.8, h:1.2, d:4.0, jumpable:false },
    { type:'bus',  w:2.2, h:2.5, d:7.0, jumpable:false },
    { type:'barrier', w:2.4, h:0.8, d:0.6, jumpable:true },
    { type:'cone', w:0.5, h:0.7, d:0.5, jumpable:true },
    { type:'hotdog', w:1.6, h:1.5, d:2.5, jumpable:false },
  ],

  SKINS: [
    { id:'default', name:'Classic Bert', colors:['#F4A460','#D2691E','#8B4513'], price:0, desc:'The OG fluffy boy' },
    { id:'golden',  name:'Golden Bert',  colors:['#FFD700','#FFA500','#B8860B'], price:50, desc:'Dripping in gold' },
    { id:'neon',    name:'Neon Bert',    colors:['#00FF87','#00D4FF','#8B5CF6'], price:75, desc:'Cyberpunk vibes' },
    { id:'ghost',   name:'Ghost Bert',   colors:['#E8E8E8','#C0C0C0','#808080'], price:60, desc:'Spooky pom' },
    { id:'flame',   name:'Fire Bert',    colors:['#FF4500','#FF6347','#B22222'], price:80, desc:'Too hot to handle' },
    { id:'ice',     name:'Ice Bert',     colors:['#87CEEB','#4169E1','#191970'], price:65, desc:'Cool snowflake' },
    { id:'galaxy',  name:'Galaxy Bert',  colors:['#9B59B6','#2980B9','#1ABC9C'], price:120, desc:'Out of this world', featured:true },
    { id:'nyc',     name:'NYC Bert',     colors:['#FF6B35','#1C1C1C','#FFD700'], price:100, desc:'Empire state of mind' },
  ],

  BOT_NAMES: [
    'CryptoKing','SolanaWhale','MoonShot','DiamondPaws','TokenHunter',
    'BlockRunner','ChainDash','PumpFinder','AlphaSniper','DeFiDog',
    'RunnerX','NYCBert','SpeedPom','TurboFluff','PomDaddy',
    'FluffBoss','PawPrint','BertFan99','SolPup','MemeKing'
  ],
};
