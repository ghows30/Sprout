class SproutView {
    constructor() {
        this.stem = null;
        this.leaves = [];
        this.svg = null;
    }

    init() {
        this.cacheDOM();
    }

    cacheDOM() {
        this.stem = document.getElementById('sprout-stem');
        this.leaves = [
            document.getElementById('sprout-leaf-1'),
            document.getElementById('sprout-leaf-2'),
            document.getElementById('sprout-leaf-3'),
            document.getElementById('sprout-leaf-4')
        ];
        this.svg = document.querySelector('.sprout');
    }

    update(percentage) {
        if (!this.stem) return;

        // Animazione Stelo (stroke-dashoffset da 120 a 0)
        const offset = 120 - (percentage * 120);
        this.stem.style.strokeDashoffset = offset;

        // Helper function for interpolation
        const interpolate = (start, end, value) => {
            if (value < start) return 0;
            if (value > end) return 1;
            return (value - start) / (end - start);
        };

        // Animazione Foglie Graduale
        // Foglia 1: 10% -> 30%
        if (this.leaves[0]) this.leaves[0].style.opacity = interpolate(0.10, 0.30, percentage);

        // Foglia 2: 30% -> 50%
        if (this.leaves[1]) this.leaves[1].style.opacity = interpolate(0.30, 0.50, percentage);

        // Foglia 3: 50% -> 70%
        if (this.leaves[2]) this.leaves[2].style.opacity = interpolate(0.50, 0.70, percentage);

        // Foglia 4: 70% -> 90%
        if (this.leaves[3]) this.leaves[3].style.opacity = interpolate(0.70, 0.90, percentage);

        // Classe blooming per stato finale sicuro
        if (percentage >= 0.99 && this.svg) {
            this.svg.classList.add('blooming');
        } else if (this.svg) {
            this.svg.classList.remove('blooming');
        }
    }

    reset() {
        if (this.stem) this.stem.style.strokeDashoffset = 120;
        this.leaves.forEach(leaf => {
            if (leaf) leaf.style.opacity = 0;
        });
        if (this.svg) this.svg.classList.remove('blooming');
    }
}
