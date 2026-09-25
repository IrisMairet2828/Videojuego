class AudioManager {
    constructor() {
        this.music = new Audio('assets/audio/music_loop.wav');
        this.music.loop = true;
        this.music.volume = 0.22;

        this.sounds = {
            dot: new Audio('assets/audio/dot.wav'),
            powerup: new Audio('assets/audio/powerup.wav'),
            enemy: new Audio('assets/audio/enemy_eaten.wav'),
            hurt: new Audio('assets/audio/hurt.wav'),
            victory: new Audio('assets/audio/victory.wav'),
            portal: new Audio('assets/audio/portal.wav'),
            menu: new Audio('assets/audio/menu.wav')
        };

        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.38;
            sound.preload = 'auto';
        });

        this.enabled = true;
        this.musicStarted = false;
    }

    play(name) {
        if (!this.enabled) return;
        const original = this.sounds[name];
        if (!original) return;

        // Clonamos para permitir sonidos repetidos sin cortar el anterior.
        const sound = original.cloneNode();
        sound.volume = original.volume;
        sound.play().catch(() => {});
    }

    startMusic() {
        if (!this.enabled) return;
        if (!this.musicStarted) {
            this.music.currentTime = 0;
            this.musicStarted = true;
        }
        this.music.play().catch(() => {});
    }

    pauseMusic() {
        this.music.pause();
    }

    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
        this.musicStarted = false;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.pauseMusic();
        else this.startMusic();
        return this.enabled;
    }
}

window.gameAudio = new AudioManager();