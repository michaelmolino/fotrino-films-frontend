<template>
  <span>
    <div v-if="profile" class="q-pa-md">
      <!-- <div class="q-pa-md text-h4 text-center">
        Dashboard
      </div> -->
      <q-btn class="q-my-sm" color="accent" no-caps icon="add_circle" label="New Collection" size="lg"/>
      <q-separator />
      <q-splitter
        model-value="50"
        separator-class="hidden"
      >
        <template v-slot:before>
          <div class="q-pa-md">
            <div id='editor_collection' class="fotrino-bootstrap"></div>
          </div>
        </template>
        <template v-slot:after>
          <div class="q-pa-md">
            <!-- <div id='editor_movies' class="fotrino-bootstrap"></div> -->
          </div>
        </template>
      </q-splitter>
    </div>
    <div v-else class="q-pa-md text-h6 text-center" style="max-width: 720px">
      Not logged in!
    </div>
  </span>
</template>

<script>
import { useMeta } from 'quasar'
import { setMetaData } from '../../javascript/library.js'

import { JSONEditor } from '@json-editor/json-editor/dist/jsoneditor.js'

export default {
  name: 'Dashboard',
  data () {
    return {
      moviesSchema: {
        type: 'array',
        headerTemplate: '&nbsp; Movies',
        items: {
          type: 'object',
          options: {
            collapsed: true
          },
          title: 'Movies',
          headerTemplate: '&nbsp;{{ self.title }}',
          required: [
            'id',
            'sort',
            'title',
            'coverUrl',
            'chapters'
          ],
          properties: {
            id: {
              type: 'integer',
              readonly: true,
              title: 'Movie ID: '
            },
            sort: {
              type: 'hidden',
              title: 'Sort Index: '
            },
            title: {
              type: 'string',
              title: 'Title: '
            },
            subTitle: {
              type: 'string',
              title: 'Subtitle: '
            },
            coverUrl: {
              type: 'string',
              readonly: true,
              format: 'uri',
              title: 'Cover URL'
            },
            chapters: {
              type: 'hidden'
            }
          }
        }
      },
      fullSchema: {
        type: 'object',
        options: {
          collapsed: false
        },
        title: 'Collection',
        headerTemplate: '&nbsp;{{ self.title }}',
        required: [
          'id',
          'uuid',
          'title',
          'coverUrl',
          'movies'
        ],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            readonly: true,
            title: 'Collection ID',
            description: 'The unique ID for your collection (used in the URL).'
          },
          uuid: {
            type: 'hidden',
            pattern: '^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$',
            readonly: true,
            title: 'Collection ID',
            description: 'The unique ID for your collection (used in the URL).'
          },
          title: {
            type: 'string',
            title: 'Title'
          },
          coverUrl: {
            type: 'string',
            readonly: true,
            format: 'uri',
            title: 'Cover URL'
          },
          movies: {
            type: 'array',
            headerTemplate: '&nbsp; Movies',
            options: {
              collapsed: true
            },
            items: {
              type: 'object',
              options: {
                collapsed: true,
                disable_collapse: true
              },
              title: 'Movies',
              headerTemplate: '&nbsp;{{ self.title }}',
              required: [
                'id',
                'sort',
                'title',
                'coverUrl',
                'chapters'
              ],
              properties: {
                id: {
                  type: 'integer',
                  readonly: true,
                  title: 'Movie ID: '
                },
                sort: {
                  type: 'hidden',
                  title: 'Sort Index: '
                },
                title: {
                  type: 'string',
                  title: 'Title: '
                },
                subTitle: {
                  type: 'string',
                  title: 'Subtitle: '
                },
                coverUrl: {
                  type: 'string',
                  readonly: true,
                  format: 'uri',
                  title: 'Cover URL'
                },
                chapters: {
                  type: 'array',
                  headerTemplate: '&nbsp; Chapters',
                  options: {
                    collapsed: false
                  },
                  items: {
                    type: 'object',
                    options: {
                      collapsed: true
                    },
                    title: 'Chapters',
                    headerTemplate: '&nbsp; {{ self.title }}',
                    required: [
                      'id',
                      'sort',
                      'title',
                      'previewUrl',
                      'src',
                      'type',
                      'primary'
                    ],
                    properties: {
                      id: {
                        type: 'integer',
                        readonly: true,
                        title: 'Chapter ID: '
                      },
                      sort: {
                        type: 'hidden',
                        title: 'Sort Index: '
                      },
                      title: {
                        type: 'string',
                        title: 'Title: '
                      },
                      description: {
                        type: 'string',
                        format: 'markdown',
                        title: 'Description: '
                      },
                      previewUrl: {
                        type: 'string',
                        format: 'uri',
                        readonly: true,
                        title: 'Preview URL: '
                      },
                      src: {
                        type: 'string',
                        readonly: true,
                        title: 'Video Source: '
                      },
                      type: {
                        type: 'string',
                        readonly: true,
                        enum: ['application/vnd.apple.mpegurl'],
                        title: 'Type: '
                      },
                      primary: {
                        type: 'boolean',
                        default: false,
                        title: 'Primary: '
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    },
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    }
  },
  created: function () {
    // TODO: this should be a new mutation that fetches all collections
    this.$store.cache
      .dispatch(
        'collection/fetchCollection',
        '91406ba9-1a15-4560-af27-1a9787de6f34'
      )
      .then(() => {
        const collectionEl = document.getElementById('editor_collection')
        const editorCollection = new JSONEditor(collectionEl, {
          startval: this.collection,
          theme: 'bootstrap4',
          iconlib: 'spectre',
          array_controls_top: true,
          disable_edit_json: true,
          remove_button_labels: true,
          disable_properties: true,
          disable_array_reorder: false,
          disable_array_delete_all_rows: true,
          disable_array_delete_last_row: true,
          disable_array_delete: false,
          disable_array_add: true,
          no_additional_properties: true,
          disable_collapse: false,
          max_depth: 2,
          schema: this.fullSchema
        })

        console.log(editorCollection)

        const moviesEl = document.getElementById('editor_movies')
        const editorMovies = new JSONEditor(moviesEl, {
          startval: this.collection.movies,
          theme: 'bootstrap4',
          iconlib: 'spectre',
          array_controls_top: false,
          disable_edit_json: true,
          remove_button_labels: false,
          disable_properties: true,
          disable_array_reorder: false,
          disable_array_delete_all_rows: true,
          disable_array_delete_last_row: true,
          disable_array_delete: false,
          disable_array_add: false,
          no_additional_properties: true,
          schema: this.moviesSchema
        })

        console.log(editorMovies)
      })
  },
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  }
}
</script>
<style type="scss">
  @import '../../css/bootstrap.css';
  @import url('https://unpkg.com/spectre.css/dist/spectre-icons.min.css');
  /* .fotrino-bootstrap .card {
    border: 0px
  } */
</style>
