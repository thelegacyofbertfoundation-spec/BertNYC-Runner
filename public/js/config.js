// =============================================
// BERT RUNNER NYC - Game Configuration
// =============================================

const CONFIG = {
  // Energy System
  MAX_ENERGY: 5,
  ENERGY_REGEN_MS: 20 * 60 * 1000, // 20 min per energy

  // Physics
  GRAVITY: 0.018,
  JUMP_FORCE: 0.35,
  JUMP_DURATION: 30, // frames

  // Speed
  INITIAL_SPEED: 0.06,
  MAX_SPEED: 0.18,
  SPEED_INCREMENT: 0.000008,

  // World
  LANE_COUNT: 3,
  LANE_WIDTH: 2.4,
  ROAD_LENGTH: 200,     // how far road renders
  DRAW_DISTANCE: 80,    // obstacle/coin visible distance
  PLAYER_Z: 5,          // player distance from camera

  // Camera
  CAMERA_HEIGHT: 3.0,
  CAMERA_FOV: 75,

  // Spawning
  OBSTACLE_MIN_GAP: 18,
  OBSTACLE_MAX_GAP: 35,
  COIN_SPAWN_RATE: 0.025,    // chance per frame
  COIN_GROUP_SIZE: 5,

  // Collision
  PLAYER_RADIUS: 0.5,
  OBSTACLE_RADIUS: 0.7,
  COIN_RADIUS: 0.6,

  // Scoring
  COIN_VALUE: 1,
  SCORE_PER_FRAME: 1,

  // Skins
  SKINS: [
    { id: 'default', name: 'Classic Bert', colors: ['#F4A460','#D2691E','#8B4513'], price: 0, desc: 'The OG fluffy boy' },
    { id: 'golden', name: 'Golden Bert', colors: ['#FFD700','#FFA500','#B8860B'], price: 50, desc: 'Dripping in gold' },
    { id: 'neon', name: 'Neon Bert', colors: ['#00FF87','#00D4FF','#8B5CF6'], price: 75, desc: 'Cyberpunk vibes' },
    { id: 'ghost', name: 'Ghost Bert', colors: ['#E8E8E8','#C0C0C0','#808080'], price: 60, desc: 'Spooky invisible pom' },
    { id: 'flame', name: 'Fire Bert', colors: ['#FF4500','#FF6347','#B22222'], price: 80, desc: 'Too hot to handle' },
    { id: 'ice', name: 'Ice Bert', colors: ['#87CEEB','#4169E1','#191970'], price: 65, desc: 'Cool as a snowflake' },
    { id: 'galaxy', name: 'Galaxy Bert', colors: ['#9B59B6','#2980B9','#1ABC9C'], price: 120, desc: 'Out of this world', featured: true },
    { id: 'nyc', name: 'NYC Bert', colors: ['#FF6B35','#1C1C1C','#FFD700'], price: 100, desc: 'Empire state of mind' },
  ],

  // Obstacle types with 3D properties
  OBSTACLES: [
    { type: 'taxi',    emoji: '🚕', w: 1.8, h: 1.2, d: 3.0, color: '#FFD700', colorDark: '#B8960B' },
    { type: 'bus',     emoji: '🚌', w: 2.0, h: 2.0, d: 5.0, color: '#FF4500', colorDark: '#B83000' },
    { type: 'barrier', emoji: '🚧', w: 2.2, h: 0.8, d: 0.5, color: '#FF8C00', colorDark: '#CC7000' },
    { type: 'hydrant', emoji: '🧯', w: 0.6, h: 0.8, d: 0.6, color: '#FF0000', colorDark: '#AA0000' },
    { type: 'cone',    emoji: '🔶', w: 0.5, h: 0.7, d: 0.5, color: '#FF6600', colorDark: '#CC5200' },
    { type: 'bike',    emoji: '🚲', w: 1.4, h: 1.0, d: 1.8, color: '#4169E1', colorDark: '#2E4BA0' },
  ],

  // Leaderboard bot names
  BOT_NAMES: [
    'CryptoKing','SolanaWhale','MoonShot','DiamondPaws','TokenHunter',
    'BlockRunner','ChainDash','PumpFinder','AlphaSniper','DeFiDog',
    'RunnerX','NYCBert','SpeedPom','TurboFluff','PomDaddy',
    'FluffBoss','PawPrint','BertFan99','SolPup','MemeKing'
  ],
};
