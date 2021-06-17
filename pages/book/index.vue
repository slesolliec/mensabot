<template>
	<div>

		<h1>Livres</h1>

		<client-only>

			<ul class="tags">
				<li v-for="tag in allTags" :key="tag.tag"><nuxt-link :to="'/tag/' + tag.tag">
					{{tag.tag}} | {{ tag.nb }}
				</nuxt-link></li>
			</ul>

			<div class="addwrapper">

				<h3 @click="showHideForm" style="cursor: pointer;">
					<i v-if="showForm" class="fas fa-minus-circle"></i>
					<i v-else class="fas fa-plus-circle"></i>
					Ajouter un livre
				</h3>

				<form v-if="showForm" v-on:submit.prevent="addReview" method="post" enctype="multipart/form-data">

					<label for="couverture">Couverture</label>
					<input type="file" name="couverture" id="couv" ref="couv" @change="handleCouv" /><br>

					<label for="title">Titre</label>
					<input name="title" v-model="newTitle" style="width: 400px;"><br>

					<label for="auteurs">Auteurs</label>
					<input name="auteurs" v-model="newAuthors" style="width: 400px;"><br>

					<label for="year">Année de parution</label>
					<input name="year" v-model="newYear"><br>

					<label for="tags">Tags</label>
					<multiselect v-model="tags" :options="options"
						:multiple="true"
						:close-on-select="false"
						:clear-on-select="false"
						:taggable="true"
						:tag-placeholder="'Ajouter ce nouveau tag'"
						:placeholder="'Choisir un tag'"
						@tag="addTag"></multiselect><br>


					<label for="rating">Note</label>
					<i :class="rating > 0 ? 'fas fa-star' : 'far fa-star'" @click="rating = 1"></i>
					<i :class="rating > 1 ? 'fas fa-star' : 'far fa-star'" @click="rating = 2"></i>
					<i :class="rating > 2 ? 'fas fa-star' : 'far fa-star'" @click="rating = 3"></i>
					<i :class="rating > 3 ? 'fas fa-star' : 'far fa-star'" @click="rating = 4"></i>
					<i :class="rating > 4 ? 'fas fa-star' : 'far fa-star'" @click="rating = 5"></i>
					<br>

					<div id="newReview" style="margin-left:125px;" v-if="newReview" v-html="$md.render(newReview)"></div>
					<label for="review">Commentaire</label>
					<textarea name="review" style="width: 400px; height: 300px;" v-model="newReview"></textarea><br>
					
					<label></label> <button type="submit">Enregistrer</button>
				</form>

			</div>


			<div class="bookwrapper" v-for="row in rows" :key="row.id">
				<div class="cover"><img v-if="row.cover_ext" :src="'/book_cover/' + row.id + '.' + row.cover_ext" width="80" height="130"></div>
				<div class="book">
					<nuxt-link :to="'/book/' + row.id">{{ row.title }}</nuxt-link><br>
					{{ row.authors }}<br>
					<span v-if="row.year">{{ row.year }}<br></span>
				</div>
				<div class="reviews">
					<div v-for="rev in row.reviews">
						<i :class="rev.rating > 0 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 1 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 2 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 3 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 4 ? 'fas fa-star' : 'far fa-star'"></i>
						par <nuxt-link :to="'/user/mid/' + rev.mid">{{ rev.real_name }}</nuxt-link>
					</div>
				</div>
				<div class="tags">
					<ul class="tags">
						<li v-for="tag in row.tags" :key="tag.tag"><nuxt-link :to="'/tag/' + tag.tag">{{tag.tag}}</nuxt-link></li>
					</ul>
				</div>
			</div>

		</client-only>

	</div>
</template>


<script>
export default {
	data() {
		return {
			rows: [],
			showForm: false,
			newTitle: '',
			newAuthors: '',
			newYear: '',
			tags: [],
			allTags: [],
			rating: 0,
			newReview: '',
			options: ['BD', 'SF', 'Polar'],
			couv: undefined
		}
	},

	methods: {

		showHideForm: function () {this.showForm = ! this.showForm},
		
		getRows: async function () {
			let {data} = await this.$axios.get('/api/book');
			this.rows = data.rows;
			this.allTags = data.tags;
			document.title = document.title.split('/')[0] + " / Livres";
		},

		addReview: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('title',   this.newTitle);
			bodyFormData.append('authors', this.newAuthors);
			bodyFormData.append('year',    this.newYear);
			bodyFormData.append('tags',    this.tags);
			bodyFormData.append('rating',  this.rating);
			bodyFormData.append('review',  this.newReview);
			bodyFormData.append('couv',    this.couv);

			let {data} = await this.$axios.post('/api/book', bodyFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
			// reset book list
			this.rows = data.rows;
			// reset form
			this.showForm   = false;
			this.newTitle   = '';
			this.newAuthors = '';
			this.newYear    = '';
			this.rating     = 0;
			this.newReview  = '';
		},

		addTag (newTag) {
			this.options.push(newTag);
			this.tags.push(newTag);
		},

		handleCouv () {
			this.couv = this.$refs.couv.files[0];
		}

	},

	mounted: function() {
		this.getRows();
	}

}

</script>


<style>
.discriminator {
	opacity: 0.4;
}

label {
	margin: 4px 0;
	display: inline-block;
	min-width: 120px;

}

form i.fa-star {
	cursor: pointer;
}

div.addwrapper {
  	margin:  8px 0;
	padding: 10px 10px 8px 10px;
	border: 1px solid #CCC;
	background: linear-gradient(135deg, rgb(118, 209, 168), #CCC, #CCC);
	box-shadow: inset 1px 1px 3px #666666;
}

div.addwrapper h3 {
	margin-top: 0;
}


div.bookwrapper {
	display: grid;
	grid-template-columns: 90px 220px auto;
	grid-gap: 5px;
  	margin:  8px 0;
	padding: 10px 10px 8px 10px;
	border: 1px solid #CCC;
	background: linear-gradient(90deg, #ddd, #ccc);
	box-shadow: inset 1px 1px 3px #666666;
}

div.bookwrapper div.cover {
	grid-column: 1;
	grid-row: 1 / span 2;
}

div.bookwrapper div.book {
	grid-column: 2;
	grid-row: 1;
}

div.bookwrapper div.reviews {
	grid-column: 3;
	grid-row: 1;
}

div.bookwrapper div.tags {
	grid-column: 2 / span 2;
	grid-row: 2;
}

div.bookwrapper ul.tags li {
	font-size: 12px;
	margin-right: 8px;
	margin-bottom: 4px;
}

div.cover img {
	box-shadow: 1px 1px 3px #666666;
}

</style>