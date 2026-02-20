// =============================================
// BERT RUNNER NYC - Configuration
// =============================================
const CONFIG = {
  MAX_ENERGY: 5,
  ENERGY_REGEN_MS: 20 * 60 * 1000,

  INITIAL_SPEED: 0.5,
  MAX_SPEED: 2.0,
  SPEED_INCREMENT: 0.00015,

  GRAVITY: 0.012,
  JUMP_FORCE: 0.22,

  PLAYER_Z: 10,
  SPAWN_Z: 250,
  DESPAWN_Z: -5,

  OBSTACLE_MIN_GAP: 35,
  OBSTACLE_MAX_GAP: 70,
  COIN_GROUP_SIZE: 5,
  COIN_GAP: 6,

  // Visual
  FOG_START: 80,
  FOG_END: 250,
  FOG_COLOR: '#1a1a3a',

  OBSTACLES: [
    { type:'taxi',    emoji:'🚕', w:2.2, h:1.4, color:'#FFD700', dark:'#B8960B', accent:'#FFF8DC' },
    { type:'bus',     emoji:'🚌', w:2.5, h:2.2, color:'#CC3333', dark:'#8B1A1A', accent:'#FF6666' },
    { type:'barrier', emoji:'🚧', w:2.8, h:0.9, color:'#FF8C00', dark:'#CC7000', accent:'#FFAA33' },
    { type:'hydrant', emoji:'🧯', w:0.8, h:1.0, color:'#CC0000', dark:'#880000', accent:'#FF3333' },
    { type:'cone',    emoji:'🔶', w:0.7, h:0.8, color:'#FF6600', dark:'#CC5200', accent:'#FF9944' },
    { type:'bike',    emoji:'🚲', w:1.8, h:1.2, color:'#3355CC', dark:'#223388', accent:'#5577EE' },
    { type:'dumpster',emoji:'🗑️', w:2.0, h:1.6, color:'#2E8B57', dark:'#1B5E3B', accent:'#3CB371' },
    { type:'mailbox', emoji:'📮', w:0.7, h:1.3, color:'#2244AA', dark:'#112266', accent:'#3366CC' },
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
