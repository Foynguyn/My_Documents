import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
dotenv.config() // kích hoạt liên kết với env
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@shoppingcardprojectclus.wr8mw.mongodb.net/?retryWrites=true&w=majority&appName=shoppingCardProjectCluster`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  //   method
  async connect() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect()
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      //   await this.client.db(process.env.DB_NAME).command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  //   hàm lấy instance của collection USERS
  // accessor property
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }
  get refresh_tokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
}

let databaseService = new DatabaseService()
export default databaseService
