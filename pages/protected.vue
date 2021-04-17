
<template>
  <div>
    <h1>Protected</h1>
	<p>This page should be protected</p>
	<p>You are user {{ me }}</p>
  </div>
</template>

<script>
export default {
	computed: {
		me() {
			return this.$store.getters.loggedInUser;
		}
	}
}

/*

{                                                                                                                                       19:33:46
  id: '396752710487113729',
  username: 'Heliode',
  avatar: '6225eb6e433f4b4ef3d5ef04275a052f',
  discriminator: '9115',
  public_flags: 0,
  flags: 0,
  locale: 'fr',
  mfa_enabled: false,
  email: 'slesolliec@gmail.com',
  verified: true
}
*/

</script>


