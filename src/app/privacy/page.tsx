import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/app/app-header";

export const metadata: Metadata = {
  title: "Privacy Policy — InTune",
  description: "How InTune collects, uses, stores, and shares your information.",
};

const sections = [
  { id: "information", label: "Information we collect" },
  { id: "use", label: "How we use it" },
  { id: "storage", label: "Storage and retention" },
  { id: "sharing", label: "How we share it" },
  { id: "choices", label: "Your choices" },
  { id: "security", label: "Security" },
  { id: "children", label: "Children’s privacy" },
  { id: "changes", label: "Policy changes" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <main className="px-6 pt-6 sm:px-10 lg:px-16">
      <AppHeader label="Privacy" />

      <div className="mx-auto grid max-w-6xl gap-14 py-20 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-24">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-lime-300">
            Legal
          </p>
          <nav aria-label="Privacy policy sections" className="mt-6 hidden lg:block">
            <ol className="space-y-3 text-sm text-white/40">
              {sections.map((section) => (
                <li key={section.id}>
                  <a className="transition hover:text-white" href={`#${section.id}`}>
                    {section.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 text-sm text-white/40">Last updated August 14, 2026</p>
          <p className="mt-10 text-lg leading-8 text-white/60">
            InTune helps people understand and compare their Spotify listening tastes.
            This policy explains what information InTune collects, why it is used, and
            the choices available to you when you use the service.
          </p>

          <div className="privacy-policy mt-16 space-y-14 text-[15px] leading-7 text-white/55">
            <section id="information">
              <h2>1. Information we collect</h2>
              <h3>Information from Spotify</h3>
              <p>
                When you connect Spotify, you authorize InTune to receive your Spotify
                user ID, display name, email address, profile image, country, account
                type, top artists and tracks, recently played tracks, and saved tracks.
                The exact access granted is shown by Spotify during authorization.
              </p>
              <h3>Information created through InTune</h3>
              <p>
                InTune stores listening snapshots, comparison invitations and
                memberships, consent records, compatibility scores, recommendations,
                and other results needed to provide the features you request.
              </p>
              <h3>Technical information</h3>
              <p>
                InTune and its infrastructure providers may process basic request and
                diagnostic information, such as IP address, browser information,
                timestamps, and error logs, to deliver and secure the service. InTune
                does not currently use third-party advertising trackers.
              </p>
            </section>

            <section id="use">
              <h2>2. How we use information</h2>
              <p>InTune uses this information to:</p>
              <ul>
                <li>authenticate your account and maintain your session;</li>
                <li>display your listening activity and music profile;</li>
                <li>create private, opt-in music taste comparisons;</li>
                <li>calculate compatibility scores and recommendations;</li>
                <li>refresh Spotify data you have authorized InTune to access; and</li>
                <li>operate, troubleshoot, and protect the service.</li>
              </ul>
              <p>
                InTune does not sell or rent your personal information, use your
                listening data for advertising, or use it to train general-purpose AI
                or machine-learning models.
              </p>
            </section>

            <section id="storage">
              <h2>3. Storage and retention</h2>
              <p>
                InTune stores your account profile, listening snapshots, recent plays,
                saved tracks, and comparison data in its database so those features
                remain available between visits. Spotify access and refresh tokens are
                encrypted before they are stored.
              </p>
              <p>
                Information is retained while your account is active and as reasonably
                necessary to provide the service, meet legal obligations, resolve
                disputes, and maintain security. Disconnecting Spotify removes the
                connected Spotify authorization from InTune, but it does not by itself
                delete previously imported listening or comparison data.
              </p>
            </section>

            <section id="sharing">
              <h2>4. How we share information</h2>
              <p>InTune may share limited information in these circumstances:</p>
              <ul>
                <li>
                  <strong>Comparison participants.</strong> A person with your private
                  invitation link can see the inviter’s display name and invitation
                  status. Once both people opt in, participants can see the comparison
                  results and the profile information shown with them.
                </li>
                <li>
                  <strong>Service providers.</strong> Hosting, database, and other
                  infrastructure providers may process information on InTune’s behalf
                  to operate the service.
                </li>
                <li>
                  <strong>Legal and safety reasons.</strong> Information may be
                  disclosed when reasonably necessary to comply with law, enforce
                  applicable terms, or protect users, the public, or the service.
                </li>
              </ul>
              <p>
                Spotify processes information under its own{" "}
                <a href="https://www.spotify.com/legal/privacy-policy/" rel="noopener noreferrer" target="_blank">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="https://www.spotify.com/legal/end-user-agreement/" rel="noopener noreferrer" target="_blank">
                  Terms
                </a>. Links that open Spotify or another website are governed by that
                service’s policies.
              </p>
            </section>

            <section id="choices">
              <h2>5. Your choices and data deletion</h2>
              <p>
                You can disconnect Spotify within InTune and revoke InTune’s access at
                any time from your{" "}
                <a href="https://www.spotify.com/account/apps/" rel="noopener noreferrer" target="_blank">
                  Spotify Apps page
                </a>. Revoking access prevents future Spotify API access but does not
                automatically remove information already stored by InTune.
              </p>
              <p>
                You may request access to or deletion of your stored information using
                the contact method below. InTune may need to verify that the request
                belongs to you before acting on it. Applicable law may provide
                additional rights to correction, restriction, portability, or objection.
              </p>
            </section>

            <section id="security">
              <h2>6. Security</h2>
              <p>
                InTune uses reasonable technical and organizational safeguards,
                including encrypted OAuth tokens and access controls. No internet
                transmission or storage system is completely secure, so absolute
                security cannot be guaranteed.
              </p>
            </section>

            <section id="children">
              <h2>7. Children’s privacy</h2>
              <p>
                InTune is not directed to children under 13, or to anyone below the
                minimum age required to use Spotify in their country. If you believe a
                child has provided personal information, contact InTune so it can be
                reviewed and deleted where appropriate.
              </p>
            </section>

            <section id="changes">
              <h2>8. Changes to this policy</h2>
              <p>
                This policy may be updated as InTune changes. Material updates will be
                posted here with a revised date. Your continued use of the service after
                an update is subject to the revised policy.
              </p>
            </section>

            <section id="contact">
              <h2>9. Contact</h2>
              <p>
                For privacy questions or data requests, contact the InTune operator
                through the project’s{" "}
                <a href="https://github.com/tonysjeon/intune" rel="noopener noreferrer" target="_blank">
                  repository
                </a>. Do not include sensitive personal information in a public issue.
              </p>
            </section>
          </div>

          <Link className="mt-16 inline-flex text-sm font-semibold text-lime-300 transition hover:text-lime-200" href="/">
            ← Back to InTune
          </Link>
        </article>
      </div>
    </main>
  );
}
