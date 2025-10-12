<template>
  <div class="q-pa-md flex flex-center">
    <q-card flat bordered class="q-pa-xl card-terms">
      <div class="text-h4 text-center q-mb-md">Privacy Policy & Terms of Use</div>
      <div class="text-caption text-center q-mb-lg">Last updated: <i>2025-10-11</i></div>
      <ol class="q-pl-md">
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Introduction</div>
          <div class="q-mb-md">
            Fotrino Films is currently under active development and is not ready for public use. The
            database, all accounts, and any associated content (including images and videos) are
            regularly deleted. You should have no expectation that this site is fit for any purpose.
          </div>
          <div class="q-mb-md">
            We respect your privacy and are committed to protecting any personal information we
            collect. This policy outlines what data we collect, how we use it, and your rights
            regarding your information.
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Information We Collect</div>
          <div>When you register an account, we collect and store the following information:</div>
          <ul class="q-pl-md q-mb-sm">
            <li>Name (used to identify your account)</li>
            <li>
              Email address (used for communication, including important notifications such as
              copyright claims)
            </li>
            <li>Profile photo (used for account identification and in shared content previews)</li>
            <li>Country (determined via IP address for localization and compliance purposes)</li>
          </ul>
          <div class="q-mb-md">
            Additionally, whenever you interact with Fotrino Films, we log basic request details,
            including the time, date, and your IP address. These logs are retained for up to 30 days
            and used solely for debugging and system improvement.
          </div>
        </li>
        <div v-for="provider in oAuthProviders" :key="provider">
          <div class="text-primary q-my-md">
            Information Received from {{ provider.toUpperCase() }} Login
          </div>
          <div>
            If you sign up or log in using {{ provider.toUpperCase() }}, we receive your name, email
            address, and profile photo from {{ provider.toUpperCase() }} to create and manage your
            account on Fotrino Films. This information is used solely for authentication, display,
            and communication purposes, and is subject to the same data deletion and privacy rights
            described in this policy.
          </div>
        </div>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Content Ownership & Responsibility</div>
          <div class="q-mb-md">
            You retain ownership of any content you upload. However, by uploading content, you
            affirm that:
          </div>
          <ul class="q-pl-md q-mb-sm">
            <li>You own or have the legal rights to distribute the content.</li>
            <li>Your content does not violate any applicable laws.</li>
            <li>
              Your content does not contain material that is prohibited by our platform (see Section
              4).
            </li>
          </ul>
          <div class="q-mb-md">
            All uploaded content is stored on servers operated by Fotrino Films. We do not claim
            ownership over your content but reserve the right to remove any material that violates
            our policies.
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Prohibited Content</div>
          <div>You may not use this platform to host or distribute content that:</div>
          <ul class="q-pl-md q-mb-sm">
            <li>
              Depicts or promotes substance abuse, suicide, self-harm, pornography, gambling, or
              extreme political views
            </li>
            <li>
              Encourages or disseminates misinformation, hate speech, violence, or conspiracy
              theories
            </li>
            <li>Violates copyright, trademarks, or intellectual property laws</li>
          </ul>
          <div class="q-mb-md">
            This list may be updated at our discretion. If you encounter content that violates these
            guidelines, please report it to michael@fotrino.com.
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Data Security</div>
          <div class="q-mb-md">
            We take commercially reasonable measures to protect your data from unauthorized access,
            loss, disclosure, or modification.
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Third-Party Services</div>
          <div class="q-mb-md">
            Fotrino Films may contain links to third-party websites or services. We do not control
            or assume responsibility for their privacy practices, terms, or content. We encourage
            users to review the privacy policies of any third-party services they interact with.
          </div>
          <div class="q-mb-md">
            We also integrate with the CommentBox (
            <q-btn
              flat
              dense
              :icon="'img:' + '/images/commentbox-32x32.png'"
              label="commentbox.io"
              href="https://commentbox.io/" />
            ) comment system. We share your name, email address, and profile photo with CommentBox
            to enable commenting functionality. Please review CommentBox’s own privacy policy for
            details on how they handle your information.
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Data Sharing & Legal Compliance</div>
          <div class="q-mb-md">
            We do not share personally identifiable information with third parties, except in the
            following circumstances:
          </div>
          <ul class="q-pl-md q-mb-sm">
            <li>When required by law enforcement or legal obligations</li>
            <li>To prevent fraud, abuse, or security threats</li>
            <li>
              When enabling third-party services you opt into (such as CommentBox, as described
              above)
            </li>
            <li>
              In the event of a merger, acquisition, or business transfer, in which case users will
              be notified
            </li>
          </ul>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Data Retention & Account Deletion</div>
          <div class="q-mb-md">
            If you wish to delete your account and associated data, please email
            michael@fotrino.com. Your request must include the email address linked to your account.
            If the request comes from a different email address, additional verification will be
            required.
          </div>
          <div class="q-mb-md">
            Upon deletion, your personal information and content will be permanently removed from
            our systems, except for data stored in system logs, which may be retained for up to 30
            days for security and compliance purposes.
          </div>
          <div>
            If you need to export your data, contact us at the same email address, and we will
            provide a downloadable file containing the information we hold about you.
          </div>
          <div v-for="provider in oAuthProviders" :key="provider">
            <div class="text-primary q-my-md">
              Information Received from {{ provider.toUpperCase() }} Login
            </div>
            <div>
              Requests to delete accounts created via {{ provider.toUpperCase() }} Login will also
              result in permanent deletion of all data received from {{ provider.toUpperCase() }}.
            </div>
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Server Locations & Data Storage</div>
          <div>
            Our servers are hosted in multiple geographic regions, including but not limited to the
            European Union, the United States, and the United Kingdom. By using Fotrino Films, you
            acknowledge that your data may be stored and processed in countries that may have
            different data protection laws than your own.
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Account Suspension & Content Removal</div>
          <div>
            We reserve the right to suspend or delete accounts, remove content, or restrict access
            to our platform if we determine, at our sole discretion, that a user has violated these
            terms or applicable laws.
          </div>
        </li>
        <q-separator />
        <li class="q-mb-lg">
          <div class="text-h6 text-primary q-mb-xs">Acceptance of This Policy</div>
          <div>
            By continuing to use Fotrino Films, you acknowledge and agree to this Privacy Policy &
            Terms of Use. If you do not agree, please discontinue use of the platform.
          </div>
          <div>For questions or concerns, contact us at michael@fotrino.com.</div>
        </li>
      </ol>
    </q-card>
  </div>
</template>

<script setup>
defineOptions({ name: 'Terms-Page' })

import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const oAuthProviders = ref([])

onMounted(async () => {
  const providers = await store.cache.dispatch('account/getProviders')
  store.commit('account/SET_PROVIDERS', providers)
  oAuthProviders.value = providers
})
</script>

<style scoped>
.card-terms {
  max-width: 800px;
  width: 100%;
}
</style>
