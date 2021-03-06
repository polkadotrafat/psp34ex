import React,{useState, useEffect, useCallback} from "react";
import {Container, Row, Col, Card, Button} from "react-bootstrap";
import { create as ipfsHttpClient, CID } from 'ipfs-http-client';
import Front from "../components/Front";
import {Buffer} from 'buffer';
import {useNavigate} from 'react-router-dom';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

const Dashboard = (props) => {
    const [active,setActive] = useState(null);
    const [ownerNFTTotal,setOwnerNFTTotal] = useState(0);
    const [uidArray,setUidArray] = useState([]);
    const [ownerNFTURI,setOwnerNFTURI] = useState(null);
    const navigate = useNavigate();
    const handleOnMint = useCallback(() => navigate('/mint', {replace: true}), [navigate]);

    console.log(ownerNFTURI);

    const gasLimit = -1;
    const check_account = async () => {
        if (props?.activeAccount?.address) {
            setActive(props.activeAccount.address);
        }
    }

    useEffect(() => {
        check_account();
    },[props.activeAccount])

    const load_balance = async () => {
        let balance = await props.nftContract.query["psp34::balanceOf"]
        (props.activeAccount.address,{gasLimit},props.activeAccount.address);
        //console.log(balance.output.toHuman());
        setOwnerNFTTotal(balance.output.toHuman());
    }

    useEffect(() => {
        load_balance();
    })

    const load_uids = async () => {
        if (ownerNFTTotal > 0) {
            let arr = [];
            console.log("total : ",ownerNFTTotal);

            for (let i = 0; i < ownerNFTTotal; ++i) {
                let uid = await props.nftContract.query["psp34Enumerable::ownersTokenByIndex"]
                (props.activeAccount.address,{gasLimit},props.activeAccount.address,i).then(
                    uid => arr.push(uid)
                );
                //console.log(i);
                //let uidx = uid.output.Ok.U8.toHuman();
                //console.log("UIDX",uidx);
                //let uri = await props.nftContract.query.getTokenUri
                //(props.activeAccount.address,{gasLimit},uid);
                //console.log(uri.output.toHuman());
                //arr.push(uri.output.toHuman());
            }
            setUidArray(arr);
            //setOwnerNFTURI(arr);
        }
    }

    useEffect(() => {
        load_uids();
    },[ownerNFTTotal])

    const load_hashes = async () => {
        if (ownerNFTTotal > 0) {
            let arr = [];

            for (let i = 0; i < ownerNFTTotal; ++i) {
                let uid = uidArray[i].output.toHuman().Ok.U8;
                //console.log(uid.output.toHuman().Ok.U8);
                //console.log("UIDX",uid.toNumber());
                let uri = await props.nftContract.query.getTokenUri
                (props.activeAccount.address,{gasLimit},uid).then(
                    uri => arr.push(uri.output.toHuman())
                )
                //console.log(uri.output.toHuman());
                //arr.push(uri.output.toHuman());
            }
            console.log(arr);

            for (let i = 0; i < ownerNFTTotal;++i) {
                let cid = arr[i];
                //let str = arr[i].split("/");
                console.log(cid);
                //cid = str[str.length-1];
                const cidformat = "f" + cid.substring(2);
                console.log("cid : ",cidformat);
                //const cidV0 = new CID(cidformat).toV0().toString();
                const resp = await client.cat(cid);
                let content = [];
                for await (const chunk of resp) {
                    content = [...content, ...chunk];
                }

                console.log(content.toString());

                const raw = Buffer.from(content).toString('utf8');
                arr[i] = JSON.parse(raw);
                //console.log(JSON.parse(raw));
                //let str = arr[i].split("/");
                //console.log(str[str.length-1]);
            }

            setOwnerNFTURI(arr);
            
        }
    }

    useEffect(() => {
        load_hashes();
    },[uidArray])

    if (!active) {
        return (<Front />)
    }
    else {
        return (
            <Container>
                <Row>
                    <Col xs="3">
                    </Col>
                    <Col xs="6" className="text-center">
                        <h3>Dashboard</h3>
                    </Col>
                    <Col xs="3"></Col>
                </Row>
                {!ownerNFTURI ? 
                <Row>
                    <Col xs="3">
                    </Col>
                    <Col xs="6" className="text-center">
                        <Card>
                            <Card.Body>
                            <Card.Text>
                                Looks like you don't have any NFTs in your dashboard. 
                                You can mint them here. 
                            </Card.Text>
                            <Button variant="danger" onClick={handleOnMint}>Mint</Button>
                            </Card.Body>
                            
                        </Card>
                    </Col>
                    <Col xs="3"></Col>
                </Row> :
                <Row xs={1} md={2} className="g-4">
                    {ownerNFTURI.map((nft, idx) => (
                        <Col>
                        <Card>
                            <Card.Img variant="top" src={nft.image} />
                            <Card.Body>
                            <Card.Title>{nft.name}</Card.Title>
                            <Card.Text>
                                {nft.description}
                            </Card.Text>
                            </Card.Body>
                        </Card>
                        </Col>
                    ))}
                </Row> }

            </Container>
        )
    }

}

export default Dashboard;