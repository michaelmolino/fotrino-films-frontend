<template>
  <div style="max-width: 720px" class="q-ma-xl">
    <h6>Terms, Conditions, &amp; Privacy Policy</h6>
    <ol>
      <li>
        We respect your privacy regarding any information we may collect from
        you.
      </li>
      <li>
        You own and are responsible for your own content; you must only upload
        legal content that you own the rights to.
      </li>
      <li>
        We protect your data within commercially acceptable means to prevent
        loss and theft, as well as unauthorised access, disclosure, copying, use
        or modification.
      </li>
      <li>
        Fotrino and Fotrino Films depend on several cloud service providers; if
        they go down or lose your data there is nothing we can do about it.
      </li>
      <li>
        The Fotrino source code is publicly available; you can review it to
        verify the expected behaviour.
      </li>
      <li>
        We don’t share any personally identifying information publicly or with
        third-parties, except when required to by law.
      </li>
      <li>
        Our website may link to external sites that are not operated by us.
        Please be aware that we have no control over the content and practices
        of these sites, and cannot accept responsibility or liability for their
        respective privacy policies.
      </li>
      <li>
        We may remove content, delete your account, or block you for any reason
        we deem suitable for instance as required by applicable laws.
      </li>
      <li>
        In addition to your content (and all metadata/exifdata) we may also
        store your name, profile picture, and email address.
      </li>
      <li>
        If you want us to remove all content and close your account please email
        creative@michaelmolino.com. Some information may remain in logs for up
        to 30 days.
      </li>
      <li>
        Your continued use of our website will be regarded as acceptance of our
        practices around privacy and personal information.
      </li>
    </ol>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { setMetaData } from '../../javascript/library.js'

export default {
  name: 'Home',
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  }
}
</script>
