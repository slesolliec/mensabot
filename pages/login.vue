
<template>
  <div>
    <h1>Connexion</h1>

	<p>Ce site est un site privé.</p>
	
	<p>Pour accéder à son contenu, vous pouvez vous authentifier via Discord en cliquant sur le bouton en haut à droite.</p>

  </div>
</template>

<script>
export default {
  auth: guest
}
// https://discord.com/oauth2/authorize?protocol=oauth2&response_type=token&access_type&client_id=719154428355018813&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=identify%20email%20identify&state=Fg4hk3hzFQ&code_challenge_method=implicit&nonce=I956bFqWXH
</script>
