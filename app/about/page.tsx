import styles from './about.module.css'

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>About</p>
          <h1 className={styles.title}>The story behind Oh Squish Me 💖</h1>
          <p className={styles.subtitle}>
            A small business built around creativity, comfort, and making more
            space for family life.
          </p>
        </section>

        <section className={styles.storyCard}>
          <p>Welcome to the world of all things squishy 💖</p>

          <p>
            I’m a proud new mum, building Oh Squish Me between nap times, late
            nights, and everything in between.
          </p>

          <p>
            After years in the corporate world, becoming a mum completely shifted
            my priorities. I wanted more time with my family, but also something
            that was truly mine — something creative, meaningful, and fun.
          </p>

          <p>That’s how Oh Squish Me was born.</p>

          <p>
            What started as a small idea quickly became something I genuinely fell
            in love with. Every squishy is handmade with care, designed to bring
            comfort, joy, and those little moments of calm we all need.
          </p>

          <p>
            Now, the Squish Lab is in full swing — balancing mum life, work life,
            and squishy life.
          </p>
        </section>

        <section className={styles.highlightCard}>
          <p className={styles.highlight}>
            Thank you for supporting this mumma’s small business dream 🎀
          </p>
          <p className={styles.tagline}>
            They are cute, soft &amp; oh-so-satisfying. Squeeze away stress 🌸
          </p>
        </section>
      </div>
    </main>
  )
}