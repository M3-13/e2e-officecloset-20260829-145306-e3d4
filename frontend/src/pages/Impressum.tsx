import type { CSSProperties } from 'react'

const cardStyle: CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
}

const sectionTitle: CSSProperties = {
  marginTop: 0,
  marginBottom: 'var(--space-3)',
  color: 'var(--color-accent)',
  fontSize: '1.25rem',
}

const mutedStyle: CSSProperties = { color: 'var(--color-muted)' }

const paragraph: CSSProperties = { margin: '0 0 var(--space-2)' }

export default function Impressum() {
  return (
    <div className="page">
      <h1>Impressum</h1>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>Angaben gemäß § 5 DDG</h2>
        <p style={paragraph}>
          Red Carpet Wardrobe
          <br />
          Musterstraße 12
          <br />
          10115 Berlin
          <br />
          Deutschland
        </p>
        <p style={paragraph}>
          <strong>Vertreten durch:</strong>
          <br />
          Max Mustermann
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>Kontakt</h2>
        <p style={paragraph}>
          Telefon: +49 (0) 30 12345678
          <br />
          E-Mail: kontakt@red-carpet-wardrobe.example
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p style={paragraph}>
          Max Mustermann
          <br />
          Musterstraße 12
          <br />
          10115 Berlin
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>Haftung für Inhalte</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
          Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>Haftung für Links</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
          keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der
          jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>Urheberrecht</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
          Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
          bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
        </p>
      </section>
    </div>
  )
}
